use tauri::Manager;

use crate::app_settings::{AppSettings, AppSettingsWriteResult};

/// OS 標準のアプリ設定ディレクトリから設定を読む。
///
/// ファイルが無い・壊れている・読めない場合は既定値を返す。
/// 起動を失敗させない。
///
/// # Arguments
///
/// * `app` - 設定ディレクトリの解決に使うアプリハンドル。
#[tauri::command]
pub fn read_app_settings<R: tauri::Runtime>(app: tauri::AppHandle<R>) -> AppSettings {
    match app.path().app_config_dir() {
        Ok(dir) => AppSettings::read_from_config_dir(&dir),
        Err(_) => AppSettings::default(),
    }
}

/// OS 標準のアプリ設定ディレクトリへ設定を書く。
///
/// Tauri の `Result<T, E>` にしないため、失敗も例外にならない。
///
/// # Arguments
///
/// * `app` - 設定ディレクトリの解決に使うアプリハンドル。
/// * `settings` - 保存するアプリ設定。
#[tauri::command]
pub fn write_app_settings<R: tauri::Runtime>(
    app: tauri::AppHandle<R>,
    settings: AppSettings,
) -> AppSettingsWriteResult {
    match app.path().app_config_dir() {
        Ok(dir) => settings.write_to_config_dir(&dir),
        Err(err) => AppSettingsWriteResult::config_dir_unavailable(&err.to_string()),
    }
}
