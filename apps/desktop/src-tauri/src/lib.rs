use std::fs;
use std::io::ErrorKind;

use serde::{Deserialize, Serialize};

/// ファイル読み込みの失敗理由。
///
/// IPC では例外にせず、この値を結果として返す。
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(tag = "kind", rename_all = "camelCase")]
pub enum FileReadError {
    /// 指定パスにファイルが存在しない。
    NotFound {
        /// 読み取り対象のパス。
        path: String,
    },
    /// ファイルの内容が UTF-8 として解釈できない。
    InvalidUtf8 {
        /// 読み取り対象のパス。
        path: String,
    },
    /// 読み取りに失敗した(権限不足・ディレクトリ指定など)。
    ReadFailed {
        /// 読み取り対象のパス。
        path: String,
        /// OS が返す失敗理由。
        message: String,
    },
}

/// ファイル読み込みの結果。成功も失敗も値として返す。
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "camelCase")]
pub enum FileReadResult {
    /// ファイル内容を UTF-8 文字列として読めた。
    Ok {
        /// ファイルの内容。
        value: String,
    },
    /// 読み取りに失敗した。
    Err {
        /// 失敗理由。
        error: FileReadError,
    },
}

/// パスのファイルを UTF-8 文字列として読む。
///
/// 失敗しても panic せず、[`FileReadResult::Err`] を返す。
///
/// # Arguments
///
/// * `path` - 読み取るファイルのパス。
pub fn read_utf8_file(path: &str) -> FileReadResult {
    match fs::read(path) {
        Err(err) if err.kind() == ErrorKind::NotFound => FileReadResult::Err {
            error: FileReadError::NotFound {
                path: path.to_string(),
            },
        },
        Err(err) => FileReadResult::Err {
            error: FileReadError::ReadFailed {
                path: path.to_string(),
                message: err.to_string(),
            },
        },
        Ok(bytes) => match String::from_utf8(bytes) {
            Ok(value) => FileReadResult::Ok { value },
            Err(_) => FileReadResult::Err {
                error: FileReadError::InvalidUtf8 {
                    path: path.to_string(),
                },
            },
        },
    }
}

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

/// パスを受けて UTF-8 文字列を返す。
///
/// Tauri の `Result<T, E>` にするとフロントエンド側で例外になるため、
/// 失敗も [`FileReadResult`] の値として返す。
#[tauri::command]
fn read_file(path: &str) -> FileReadResult {
    read_utf8_file(path)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![greet, read_file])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}