use crate::file_read::{read_utf8_file, FileReadError, FileReadResult};

/// パスを受けて UTF-8 文字列を返す。
///
/// Tauri の `Result<T, E>` にするとフロントエンド側で例外になるため、
/// 失敗も [`FileReadResult`] の値として返す。
///
/// # Arguments
///
/// * `path` - 読み取るファイルのパス。
#[tauri::command]
pub async fn read_file(path: String) -> FileReadResult {
    let failure_path = path.clone();
    tauri::async_runtime::spawn_blocking(move || read_utf8_file(&path))
        .await
        .unwrap_or_else(|error| FileReadResult::Err {
            error: FileReadError::ReadFailed {
                path: failure_path,
                message: error.to_string(),
            },
        })
}
