use std::fs::{self, File};
use std::io::{self, Write};
use std::path::{Path, PathBuf};
use std::sync::atomic::{AtomicU64, Ordering};
use std::time::{SystemTime, UNIX_EPOCH};

use serde::{Deserialize, Serialize};

/// ファイル書き込みの失敗理由。
///
/// IPC では例外にせず、この値を結果として返す。
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(tag = "kind", rename_all = "camelCase")]
pub enum FileWriteError {
    /// 書き込みに失敗した(権限不足・ディレクトリ指定・親ディレクトリ欠損など)。
    WriteFailed {
        /// 書き込み対象のパス。
        path: String,
        /// OS が返す失敗理由。
        message: String,
    },
}

/// ファイル書き込みの結果。成功も失敗も値として返す。
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "camelCase")]
pub enum FileWriteResult {
    /// 対象パスへ内容を書き込めた。
    Ok,
    /// 書き込みに失敗した。
    Err {
        /// 失敗理由。
        error: FileWriteError,
    },
}

/// パスへ UTF-8 文字列をアトミックに書く。
///
/// 同一ディレクトリの一時ファイルへ書いてから rename で置き換える。
/// 失敗しても panic せず、[`FileWriteResult::Err`] を返す。
/// 失敗時は対象パスの既存内容を置き換えない。
///
/// # Arguments
///
/// * `path` - 書き込むファイルのパス。
/// * `contents` - 書き込む UTF-8 文字列。
pub fn write_utf8_file(path: &str, contents: &str) -> FileWriteResult {
    let target_path = crate::ipc_path::decode(path);
    let target = target_path.as_path();
    let (temp_path, temp_file) = match create_overwrite_temp_file(target) {
        Ok(temp) => temp,
        Err(error) => return write_failed(path, &error.to_string()),
    };

    if let Err(err) = write_temp_then_rename(temp_file, &temp_path, target, contents) {
        let _ = fs::remove_file(&temp_path);
        return write_failed(path, &err.to_string());
    }

    FileWriteResult::Ok
}

/// 新規 .dmodel を作成する。既存ファイルやシンボリックリンクは置換しない。
/// 完全な内容を用意してから、対象パスを排他的に作成する。
pub fn create_dmodel_file(path: &str, contents: &str) -> FileWriteResult {
    let target_path = crate::ipc_path::decode(path);
    let target = target_path.as_path();
    if !target
        .extension()
        .and_then(|extension| extension.to_str())
        .is_some_and(|extension| extension.eq_ignore_ascii_case("dmodel"))
    {
        return write_failed(path, "保存先には新規 .dmodel ファイルを指定してください");
    }
    create_utf8_file(path, contents)
}

/// UTF-8 文書を排他的に新規作成する。既存ファイルやリンクは置換しない。
/// 完成した一時ファイルだけを、上書きしないOS操作で公開する。
pub fn create_utf8_file(path: &str, contents: &str) -> FileWriteResult {
    let target = crate::ipc_path::decode(path);
    let (temp_path, mut temp_file) = match create_temp_file(&target) {
        Ok(temp) => temp,
        Err(error) => return write_failed(path, &error.to_string()),
    };
    let prepared = temp_file
        .write_all(contents.as_bytes())
        .and_then(|()| temp_file.sync_all());
    if let Err(error) = prepared {
        drop(temp_file);
        let _ = fs::remove_file(&temp_path);
        return write_failed(path, &error.to_string());
    }
    // 公開が終わるまで inode のハンドルを保持し、一時パスだけを根拠にしない。
    // no-replace rename は hard link 非対応のボリュームでも既存先を置換しない。
    match publish_new_file(&temp_file, &temp_path, &target) {
        Ok(PublishMethod::Linked) => {
            drop(temp_file);
            let _ = fs::remove_file(&temp_path);
            FileWriteResult::Ok
        }
        Ok(PublishMethod::Renamed) => {
            drop(temp_file);
            FileWriteResult::Ok
        }
        Err(error) => {
            drop(temp_file);
            let _ = fs::remove_file(&temp_path);
            write_failed(path, &error.to_string())
        }
    }
}

enum PublishMethod {
    Linked,
    Renamed,
}

fn publish_new_file(
    temp_file: &File,
    temp_path: &Path,
    target: &Path,
) -> io::Result<PublishMethod> {
    if !open_file_matches_path(temp_file, temp_path) {
        return Err(io::Error::new(
            io::ErrorKind::Other,
            "temporary file path no longer names the prepared file",
        ));
    }
    let method = publish_open_file(
        temp_file,
        link_open_file(temp_file, temp_path, target),
        temp_path,
        target,
    )?;
    if !open_file_matches_path(temp_file, target) {
        return Err(io::Error::new(
            io::ErrorKind::Other,
            "published file is not the prepared temporary file",
        ));
    }
    Ok(method)
}

fn publish_open_file(
    temp_file: &File,
    link_result: io::Result<()>,
    temp_path: &Path,
    target: &Path,
) -> io::Result<PublishMethod> {
    match link_result {
        Ok(()) => Ok(PublishMethod::Linked),
        Err(error) if error.kind() == io::ErrorKind::AlreadyExists => Err(error),
        Err(_) => rename_open_file_no_replace(temp_file, temp_path, target)
            .map(|()| PublishMethod::Renamed),
    }
}

#[cfg(windows)]
fn rename_open_file_no_replace(
    file: &File,
    _source: &Path,
    target: &Path,
) -> io::Result<()> {
    use std::ffi::c_void;
    use std::os::windows::ffi::OsStrExt;
    use std::os::windows::io::AsRawHandle;

    #[repr(C)]
    struct FileRenameInfo {
        flags: u32,
        root_directory: *mut c_void,
        file_name_length: u32,
        file_name: [u16; 1],
    }

    #[link(name = "Kernel32")]
    extern "system" {
        fn SetFileInformationByHandle(
            file: *mut c_void,
            information_class: u32,
            information: *mut c_void,
            buffer_size: u32,
        ) -> i32;
    }

    const FILE_RENAME_INFO_EX: u32 = 22;
    let name = target.as_os_str().encode_wide().collect::<Vec<_>>();
    let header = std::mem::offset_of!(FileRenameInfo, file_name);
    let buffer_size = header + name.len() * std::mem::size_of::<u16>();
    let word_count = buffer_size.div_ceil(std::mem::size_of::<usize>());
    let mut buffer = vec![0usize; word_count];
    let information = buffer.as_mut_ptr().cast::<FileRenameInfo>();
    unsafe {
        (*information).flags = 0;
        (*information).root_directory = std::ptr::null_mut();
        (*information).file_name_length = (name.len() * 2) as u32;
        std::ptr::copy_nonoverlapping(
            name.as_ptr(),
            (*information).file_name.as_mut_ptr(),
            name.len(),
        );
    }
    let result = unsafe {
        SetFileInformationByHandle(
            file.as_raw_handle().cast(),
            FILE_RENAME_INFO_EX,
            information.cast(),
            buffer_size as u32,
        )
    };
    (result != 0)
        .then_some(())
        .ok_or_else(io::Error::last_os_error)
}

#[cfg(not(windows))]
fn rename_open_file_no_replace(
    _file: &File,
    source: &Path,
    target: &Path,
) -> io::Result<()> {
    rename_no_replace(source, target)
}

#[cfg(unix)]
fn link_open_file(file: &File, _temp_path: &Path, target: &Path) -> io::Result<()> {
    use std::ffi::CString;
    use std::os::fd::AsRawFd;
    use std::os::raw::{c_char, c_int};
    use std::os::unix::ffi::OsStrExt;

    const AT_FDCWD: c_int = -100;
    const AT_SYMLINK_FOLLOW: c_int = 0x400;
    extern "C" {
        fn linkat(
            olddirfd: c_int,
            oldpath: *const c_char,
            newdirfd: c_int,
            newpath: *const c_char,
            flags: c_int,
        ) -> c_int;
    }
    #[cfg(any(target_os = "linux", target_os = "android"))]
    let source = format!("/proc/self/fd/{}", file.as_raw_fd());
    #[cfg(not(any(target_os = "linux", target_os = "android")))]
    let source = format!("/dev/fd/{}", file.as_raw_fd());
    let source = CString::new(source)
        .map_err(|_| io::Error::new(io::ErrorKind::InvalidInput, "source path contains NUL"))?;
    let target = CString::new(target.as_os_str().as_bytes())
        .map_err(|_| io::Error::new(io::ErrorKind::InvalidInput, "target path contains NUL"))?;
    let result = unsafe {
        linkat(
            AT_FDCWD,
            source.as_ptr(),
            AT_FDCWD,
            target.as_ptr(),
            AT_SYMLINK_FOLLOW,
        )
    };
    (result == 0)
        .then_some(())
        .ok_or_else(io::Error::last_os_error)
}

#[cfg(not(unix))]
fn link_open_file(
    _file: &File,
    temp_path: &Path,
    target: &Path,
) -> io::Result<()> {
    // Windowsではcreate_temp_fileの共有モードで一時パスの削除・renameを禁止する。
    fs::hard_link(temp_path, target)
}

#[cfg(unix)]
fn open_file_matches_path(file: &File, path: &Path) -> bool {
    use std::os::unix::fs::MetadataExt;

    let (Ok(opened), Ok(named)) = (file.metadata(), fs::metadata(path)) else {
        return false;
    };
    opened.dev() == named.dev() && opened.ino() == named.ino()
}

#[cfg(windows)]
fn open_file_matches_path(file: &File, path: &Path) -> bool {
    use std::os::windows::fs::OpenOptionsExt;

    // 内容の読み取り権限を要求せず、識別情報だけを取得する。
    let Ok(named) = File::options().access_mode(0).open(path) else {
        return false;
    };
    crate::file_identity::same_open_file(file, &named).unwrap_or(false)
}

#[cfg(not(any(unix, windows)))]
fn open_file_matches_path(_file: &File, _path: &Path) -> bool {
    false
}

#[cfg(any(target_os = "linux", target_os = "android"))]
fn rename_no_replace(source: &Path, target: &Path) -> io::Result<()> {
    use std::ffi::CString;
    use std::os::raw::{c_char, c_int};
    use std::os::unix::ffi::OsStrExt;

    const AT_FDCWD: c_int = -100;
    const RENAME_NOREPLACE: u32 = 1;
    extern "C" {
        fn renameat2(
            olddirfd: c_int,
            oldpath: *const c_char,
            newdirfd: c_int,
            newpath: *const c_char,
            flags: u32,
        ) -> c_int;
    }
    let source = CString::new(source.as_os_str().as_bytes())
        .map_err(|_| io::Error::new(io::ErrorKind::InvalidInput, "source path contains NUL"))?;
    let target = CString::new(target.as_os_str().as_bytes())
        .map_err(|_| io::Error::new(io::ErrorKind::InvalidInput, "target path contains NUL"))?;
    let result = unsafe {
        renameat2(
            AT_FDCWD,
            source.as_ptr(),
            AT_FDCWD,
            target.as_ptr(),
            RENAME_NOREPLACE,
        )
    };
    (result == 0)
        .then_some(())
        .ok_or_else(io::Error::last_os_error)
}

#[cfg(any(target_os = "macos", target_os = "ios"))]
fn rename_no_replace(source: &Path, target: &Path) -> io::Result<()> {
    use std::ffi::CString;
    use std::os::raw::{c_char, c_int};
    use std::os::unix::ffi::OsStrExt;

    const RENAME_EXCL: u32 = 0x0000_0004;
    extern "C" {
        fn renamex_np(old: *const c_char, new: *const c_char, flags: u32) -> c_int;
    }
    let source = CString::new(source.as_os_str().as_bytes())
        .map_err(|_| io::Error::new(io::ErrorKind::InvalidInput, "source path contains NUL"))?;
    let target = CString::new(target.as_os_str().as_bytes())
        .map_err(|_| io::Error::new(io::ErrorKind::InvalidInput, "target path contains NUL"))?;
    let result = unsafe { renamex_np(source.as_ptr(), target.as_ptr(), RENAME_EXCL) };
    (result == 0)
        .then_some(())
        .ok_or_else(io::Error::last_os_error)
}

#[cfg(windows)]
fn rename_no_replace(source: &Path, target: &Path) -> io::Result<()> {
    use std::os::windows::ffi::OsStrExt;

    #[link(name = "Kernel32")]
    extern "system" {
        fn MoveFileExW(
            existing_file_name: *const u16,
            new_file_name: *const u16,
            flags: u32,
        ) -> i32;
    }
    let source = source
        .as_os_str()
        .encode_wide()
        .chain(std::iter::once(0))
        .collect::<Vec<_>>();
    let target = target
        .as_os_str()
        .encode_wide()
        .chain(std::iter::once(0))
        .collect::<Vec<_>>();
    // MOVEFILE_REPLACE_EXISTING を指定しないことで、既存の保存先を保護する。
    let result = unsafe { MoveFileExW(source.as_ptr(), target.as_ptr(), 0) };
    (result != 0)
        .then_some(())
        .ok_or_else(io::Error::last_os_error)
}

#[cfg(not(any(
    target_os = "linux",
    target_os = "android",
    target_os = "macos",
    target_os = "ios",
    windows,
)))]
fn rename_no_replace(_source: &Path, _target: &Path) -> io::Result<()> {
    Err(io::Error::new(
        io::ErrorKind::Unsupported,
        "atomic no-replace rename is unsupported",
    ))
}

fn write_failed(path: &str, message: &str) -> FileWriteResult {
    FileWriteResult::Err {
        error: FileWriteError::WriteFailed {
            path: path.to_string(),
            message: message.to_string(),
        },
    }
}

fn create_temp_file(target: &Path) -> io::Result<(PathBuf, File)> {
    create_temp_file_with_options(target, false)
}

fn create_overwrite_temp_file(target: &Path) -> io::Result<(PathBuf, File)> {
    create_temp_file_with_options(target, true)
}

fn create_temp_file_with_options(
    target: &Path,
    _allow_delete_sharing: bool,
) -> io::Result<(PathBuf, File)> {
    if target.file_name().is_none() {
        return Err(io::Error::new(
            io::ErrorKind::InvalidInput,
            "path has no file name",
        ));
    }
    let parent = match target.parent() {
        Some(parent) if !parent.as_os_str().is_empty() => parent,
        _ => Path::new("."),
    };
    let nanos = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|duration| duration.as_nanos())
        .unwrap_or(0);
    loop {
        let nonce = TEMP_FILE_NONCE.fetch_add(1, Ordering::Relaxed);
        let path = parent.join(format!(
            ".domain-modeler-tmp-{}-{nanos:x}-{nonce:x}",
            std::process::id(),
        ));
        let mut options = File::options();
        options.write(true).create_new(true);
        #[cfg(windows)]
        {
            use std::os::windows::fs::OpenOptionsExt;
            // 開いている間の削除・renameを共有せず、一時パスの差し替えを防ぐ。
            const DELETE: u32 = 0x0001_0000;
            const FILE_SHARE_READ: u32 = 0x0000_0001;
            const FILE_SHARE_WRITE: u32 = 0x0000_0002;
            const FILE_SHARE_DELETE: u32 = 0x0000_0004;
            const GENERIC_WRITE: u32 = 0x4000_0000;
            options.access_mode(GENERIC_WRITE | DELETE);
            let delete_sharing = if _allow_delete_sharing {
                FILE_SHARE_DELETE
            } else {
                0
            };
            options.share_mode(FILE_SHARE_READ | FILE_SHARE_WRITE | delete_sharing);
        }
        match options.open(&path) {
            Ok(file) => return Ok((path, file)),
            Err(error) if error.kind() == io::ErrorKind::AlreadyExists => {}
            Err(error) => return Err(error),
        }
    }
}

static TEMP_FILE_NONCE: AtomicU64 = AtomicU64::new(0);

fn write_temp_then_rename(
    mut file: File,
    temp_path: &Path,
    target: &Path,
    contents: &str,
) -> io::Result<()> {
    file.write_all(contents.as_bytes())?;
    file.sync_all()?;
    fs::rename(temp_path, target)
}

#[cfg(test)]
mod file_write_test;
