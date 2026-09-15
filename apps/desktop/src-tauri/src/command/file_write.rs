use crate::file_write::{write_utf8_file, FileWriteResult};

/// パスと UTF-8 文字列を受けてアトミックに書き込む。
///
/// Tauri の `Result<T, E>` にするとフロントエンド側で例外になるため、
/// 失敗も [`FileWriteResult`] の値として返す。
///
/// # Arguments
///
/// * `path` - 書き込むファイルのパス。
/// * `contents` - 書き込む UTF-8 文字列。
#[tauri::command]
pub fn write_file(path: &str, contents: &str) -> FileWriteResult {
    write_utf8_file(path, contents)
}

/// 既存ファイルを上書きせず、生成したモデルを新規保存する。
#[tauri::command]
pub fn create_dmodel_file(path: &str, contents: &str) -> FileWriteResult {
    crate::file_write::create_dmodel_file(path, contents)
}
