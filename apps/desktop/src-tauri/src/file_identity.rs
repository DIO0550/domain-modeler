use std::ffi::c_void;
use std::fs::File;
use std::io;
use std::os::windows::io::AsRawHandle;

/// 開いたハンドルのボリュームと128ビットIDでファイルの同一性を判定する。
/// 取得できない場合はエラーを返し、不明なID同士を一致とみなさない。
pub(crate) fn same_open_file(left: &File, right: &File) -> io::Result<bool> {
    Ok(FileIdentity::read(left)? == FileIdentity::read(right)?)
}

// Windows SDKのFILE_ID_INFOと同じレイアウト。ReFSの128ビットIDも保持する。
#[repr(C)]
#[derive(Default, PartialEq, Eq)]
struct FileIdentity {
    volume_serial_number: u64,
    file_id: [u8; 16],
}

impl FileIdentity {
    fn read(file: &File) -> io::Result<Self> {
        const FILE_ID_INFO: i32 = 18;
        let mut identity = Self::default();
        // SAFETY: Fileが所有する有効なハンドルと、FILE_ID_INFOに一致する
        // 書き込み可能なバッファ・サイズを渡す。ハンドルの所有権は移さない。
        let result = unsafe {
            GetFileInformationByHandleEx(
                file.as_raw_handle(),
                FILE_ID_INFO,
                (&mut identity as *mut Self).cast(),
                std::mem::size_of::<Self>() as u32,
            )
        };
        if result == 0 {
            return Err(io::Error::last_os_error());
        }
        Ok(identity)
    }
}

#[link(name = "Kernel32")]
extern "system" {
    fn GetFileInformationByHandleEx(
        file: *mut c_void,
        information_class: i32,
        information: *mut c_void,
        buffer_size: u32,
    ) -> i32;
}

#[cfg(test)]
mod file_identity_test;
