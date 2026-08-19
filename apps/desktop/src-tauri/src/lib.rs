mod app_settings;
mod command;
mod file_dialog;
mod file_read;
mod file_watch;
mod file_write;

#[cfg(test)]
mod temp_workspace;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .manage(file_watch::FileWatchRegistry::new())
        .invoke_handler(command::invoke_handler())
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
