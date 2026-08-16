mod file_dialog;
mod file_read;
mod file_write;

#[cfg(test)]
mod temp_workspace;

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            greet,
            file_read::read_file,
            file_write::write_file,
            file_dialog::open_file_dialog,
            file_dialog::save_file_dialog
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
