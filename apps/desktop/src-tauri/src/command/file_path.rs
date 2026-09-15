/// 2つのパスがファイルシステム上で同じファイルを表すかを返す。
#[tauri::command]
pub async fn same_file_path(left: String, right: String) -> bool {
    tauri::async_runtime::spawn_blocking(move || crate::file_path::same_file_path(&left, &right))
        .await
        .unwrap_or(true)
}
