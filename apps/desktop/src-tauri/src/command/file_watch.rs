use tauri::{Emitter, Manager};

use crate::file_watch::{
    FileWatchError, FileWatchEvent, FileWatchRegistry, FileWatchResult, FILE_WATCH_EVENT,
};

/// 対象パスのファイル監視を開始する。
///
/// 変更・削除は [`FILE_WATCH_EVENT`] としてフロントエンドへ送る。
/// Tauri の `Result<T, E>` にしないため、失敗も例外にならない。
///
/// # Arguments
///
/// * `app` - 監視セッションの取得とイベント送出に使うアプリハンドル。
/// * `path` - 監視するファイルのパス。
#[tauri::command]
pub async fn start_file_watch<R: tauri::Runtime>(
    app: tauri::AppHandle<R>,
    path: String,
) -> FileWatchResult {
    let failure_path = path.clone();
    let registry = app.state::<FileWatchRegistry>().inner().clone();
    tauri::async_runtime::spawn_blocking(move || {
        registry.start(&path, move |event: FileWatchEvent| {
            let _ = app.emit(FILE_WATCH_EVENT, &event);
        })
    })
    .await
    .unwrap_or_else(|error| watch_join_failed(failure_path, error.to_string()))
}

/// 対象パスのファイル監視を停止する。
///
/// 監視していなかったパスでも成功として返す。
///
/// # Arguments
///
/// * `app` - 監視セッションを取得するアプリハンドル。
/// * `path` - 監視を止めるファイルのパス。
#[tauri::command]
pub async fn stop_file_watch<R: tauri::Runtime>(
    app: tauri::AppHandle<R>,
    path: String,
) -> FileWatchResult {
    let failure_path = path.clone();
    let registry = app.state::<FileWatchRegistry>().inner().clone();
    tauri::async_runtime::spawn_blocking(move || registry.stop(&path))
        .await
        .unwrap_or_else(|error| watch_join_failed(failure_path, error.to_string()))
}

fn watch_join_failed(path: String, message: String) -> FileWatchResult {
    FileWatchResult::Err {
        error: FileWatchError::WatchFailed { path, message },
    }
}
