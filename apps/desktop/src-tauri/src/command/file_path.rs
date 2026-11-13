/// 2つのパスがファイルシステム上で同じファイルを表すかを返す。
#[tauri::command]
pub async fn same_file_path(left: String, right: String) -> bool {
    if !crate::file_dialog::is_document_path(&crate::ipc_path::decode(&left))
        || !crate::file_dialog::is_document_path(&crate::ipc_path::decode(&right))
    {
        return true;
    }

    tauri::async_runtime::spawn_blocking(move || crate::file_path::same_file_path(&left, &right))
        .await
        .unwrap_or(true)
}
