use tauri::{Emitter, State};

use crate::file_watch::{FileWatchEvent, FileWatchRegistry, FileWatchResult, FILE_WATCH_EVENT};

/// 対象パスのファイル監視を開始する。
///
/// 変更・削除は [`FILE_WATCH_EVENT`] としてフロントエンドへ送る。
/// Tauri の `Result<T, E>` にしないため、失敗も例外にならない。
///
/// # Arguments
///
/// * `app` - イベント送出に使うアプリハンドル。
/// * `registry` - パスごとの監視セッション。
/// * `path` - 監視するファイルのパス。
#[tauri::command]
pub fn start_file_watch<R: tauri::Runtime>(
    app: tauri::AppHandle<R>,
    registry: State<FileWatchRegistry>,
    path: &str,
) -> FileWatchResult {
    registry.start(path, {
        let app = app.clone();
        move |event: FileWatchEvent| {
            let _ = app.emit(FILE_WATCH_EVENT, &event);
        }
    })
}

/// 対象パスのファイル監視を停止する。
///
/// 監視していなかったパスでも成功として返す。
///
/// # Arguments
///
/// * `registry` - パスごとの監視セッション。
/// * `path` - 監視を止めるファイルのパス。
#[tauri::command]
pub fn stop_file_watch(registry: State<FileWatchRegistry>, path: &str) -> FileWatchResult {
    registry.stop(path)
}
