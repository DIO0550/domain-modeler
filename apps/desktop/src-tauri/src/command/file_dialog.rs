use tauri_plugin_dialog::{DialogExt, FileDialogBuilder};

use crate::file_dialog::{
    open_dialog_filters, open_dialog_result, save_dialog_result, DialogFilter, DocumentKind,
};

fn apply_filters<R: tauri::Runtime>(
    builder: FileDialogBuilder<R>,
    filters: &[DialogFilter],
) -> FileDialogBuilder<R> {
    filters.iter().fold(builder, |builder, filter| {
        builder.add_filter(filter.name, filter.extensions)
    })
}

/// `.dcanvas` / `.dmodel` フィルタ付きの開くダイアログを表示する。
///
/// キャンセル時は [`None`]、選択時はパス文字列を返す。
/// Tauri の `Result<T, E>` にしないため、キャンセルは例外にならない。
#[tauri::command]
pub async fn open_file_dialog<R: tauri::Runtime>(app: tauri::AppHandle<R>) -> Option<String> {
    let builder = apply_filters(app.dialog().file(), open_dialog_filters());
    open_dialog_result(builder.blocking_pick_file())
}

/// 文書種別の拡張子フィルタ付きの保存ダイアログを表示する。
///
/// キャンセル時は [`None`]、選択時はパス文字列を返す。
/// Tauri の `Result<T, E>` にしないため、キャンセルは例外にならない。
///
/// # Arguments
///
/// * `app` - ダイアログを出すアプリハンドル。
/// * `kind` - 保存する文書の種別。
#[tauri::command]
pub async fn save_file_dialog<R: tauri::Runtime>(
    app: tauri::AppHandle<R>,
    kind: DocumentKind,
) -> Option<String> {
    let filter = kind.dialog_filter();
    let builder = app
        .dialog()
        .file()
        .add_filter(filter.name, filter.extensions);
    save_dialog_result(builder.blocking_save_file(), kind)
}
