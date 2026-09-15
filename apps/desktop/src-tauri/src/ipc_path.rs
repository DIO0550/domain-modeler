use std::path::{Path, PathBuf};

// NUL は OS のパス要素に使えないため、通常のパスと衝突しない。
const PREFIX: &str = "\0domain-modeler-path-v1:";

/// IPC で運べない OS 固有のパスだけを、表示用文字列付きの可逆形式にする。
pub fn encode(path: &Path) -> String {
    if let Some(path) = path.to_str() {
        return path.to_string();
    }

    #[cfg(unix)]
    {
        use std::os::unix::ffi::OsStrExt;
        return encoded("unix", path.as_os_str().as_bytes(), path);
    }

    #[cfg(windows)]
    {
        use std::os::windows::ffi::OsStrExt;
        let bytes = path
            .as_os_str()
            .encode_wide()
            .flat_map(u16::to_le_bytes)
            .collect::<Vec<_>>();
        return encoded("windows", &bytes, path);
    }

    #[allow(unreachable_code)]
    path.to_string_lossy().into_owned()
}

/// [`encode`] が返した文字列を元の OS パスへ戻す。通常の UTF-8 パスも受け付ける。
pub fn decode(path: &str) -> PathBuf {
    let Some(encoded) = path.strip_prefix(PREFIX) else {
        return PathBuf::from(path);
    };
    let Some((platform_and_hex, _display)) = encoded.split_once('|') else {
        return PathBuf::from(path);
    };
    let Some((platform, hex)) = platform_and_hex.split_once(':') else {
        return PathBuf::from(path);
    };
    let Some(bytes) = decode_hex(hex) else {
        return PathBuf::from(path);
    };

    #[cfg(unix)]
    if platform == "unix" {
        use std::os::unix::ffi::OsStringExt;
        return PathBuf::from(std::ffi::OsString::from_vec(bytes));
    }

    #[cfg(windows)]
    if platform == "windows" && bytes.len() % 2 == 0 {
        use std::os::windows::ffi::OsStringExt;
        let wide = bytes
            .chunks_exact(2)
            .map(|pair| u16::from_le_bytes([pair[0], pair[1]]))
            .collect::<Vec<_>>();
        return PathBuf::from(std::ffi::OsString::from_wide(&wide));
    }

    PathBuf::from(path)
}

fn encoded(platform: &str, bytes: &[u8], path: &Path) -> String {
    let mut result = format!("{PREFIX}{platform}:");
    for byte in bytes {
        use std::fmt::Write;
        let _ = write!(result, "{byte:02x}");
    }
    result.push('|');
    result.push_str(&path.to_string_lossy());
    result
}

fn decode_hex(value: &str) -> Option<Vec<u8>> {
    if value.len() % 2 != 0 {
        return None;
    }
    (0..value.len())
        .step_by(2)
        .map(|index| u8::from_str_radix(&value[index..index + 2], 16).ok())
        .collect()
}

#[cfg(test)]
mod tests {
    use super::{decode, encode};
    use std::path::PathBuf;

    #[test]
    fn utf8_path_is_unchanged() {
        let path = PathBuf::from("/tmp/注文.dmodel");
        assert_eq!(encode(&path), "/tmp/注文.dmodel");
        assert_eq!(decode(&encode(&path)), path);
    }

    #[cfg(unix)]
    #[test]
    fn non_utf8_path_round_trips() {
        use std::os::unix::ffi::OsStringExt;
        let path = PathBuf::from(std::ffi::OsString::from_vec(
            b"/tmp/non-utf8-\xff/draft.dmodel".to_vec(),
        ));
        let encoded = encode(&path);
        assert!(encoded.starts_with("\0domain-modeler-path-v1:unix:"));
        assert!(encoded.ends_with("/draft.dmodel"));
        assert_eq!(decode(&encoded), path);
    }
}
