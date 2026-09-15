use crate::file_write::{write_utf8_file, FileWriteError, FileWriteResult};

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
pub async fn write_file(path: String, contents: String) -> FileWriteResult {
    run_blocking_file_write(path, move |path| write_utf8_file(path, &contents)).await
}

/// 既存ファイルを上書きせず、生成したモデルを新規保存する。
#[tauri::command]
pub async fn create_dmodel_file(path: String, contents: String) -> FileWriteResult {
    run_blocking_file_write(path, move |path| {
        crate::file_write::create_dmodel_file(path, &contents)
    })
    .await
}

/// 両種の文書を、既存ファイルを上書きせず新規保存する。
#[tauri::command]
pub async fn create_file(path: String, contents: String) -> FileWriteResult {
    run_blocking_file_write(path, move |path| {
        crate::file_write::create_utf8_file(path, &contents)
    })
    .await
}

async fn run_blocking_file_write(
    path: String,
    write: impl FnOnce(&str) -> FileWriteResult + Send + 'static,
) -> FileWriteResult {
    let failure_path = path.clone();
    tauri::async_runtime::spawn_blocking(move || write(&path))
        .await
        .unwrap_or_else(|error| FileWriteResult::Err {
            error: FileWriteError::WriteFailed {
                path: failure_path,
                message: error.to_string(),
            },
        })
}
