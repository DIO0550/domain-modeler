/// 2つのパスがファイルシステム上で同じファイルを表すかを返す。
#[tauri::command]
pub fn same_file_path(left: &str, right: &str) -> bool {
    crate::file_path::same_file_path(left, right)
}
