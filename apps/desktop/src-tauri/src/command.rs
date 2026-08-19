mod app_settings;
mod file_dialog;
mod file_read;
mod file_watch;
mod file_write;
mod greet;

/// フロントエンドへ公開する IPC command を登録する。
pub fn invoke_handler<R: tauri::Runtime>(
) -> impl Fn(tauri::ipc::Invoke<R>) -> bool + Send + Sync + 'static {
    tauri::generate_handler![
        greet::greet,
        file_read::read_file,
        file_write::write_file,
        file_dialog::open_file_dialog,
        file_dialog::save_file_dialog,
        file_watch::start_file_watch,
        file_watch::stop_file_watch,
        app_settings::read_app_settings,
        app_settings::write_app_settings
    ]
}
