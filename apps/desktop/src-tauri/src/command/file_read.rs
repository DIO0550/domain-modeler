use crate::file_read::{read_utf8_file, FileReadResult};

/// パスを受けて UTF-8 文字列を返す。
///
/// Tauri の `Result<T, E>` にするとフロントエンド側で例外になるため、
/// 失敗も [`FileReadResult`] の値として返す。
///
/// # Arguments
///
/// * `path` - 読み取るファイルのパス。
#[tauri::command]
pub fn read_file(path: &str) -> FileReadResult {
    read_utf8_file(path)
}
