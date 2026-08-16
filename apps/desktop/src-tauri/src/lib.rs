use std::fs::{self, File};
use std::io::{self, ErrorKind, Write};
use std::path::{Path, PathBuf};
use std::time::{SystemTime, UNIX_EPOCH};

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

/// ファイル書き込みの失敗理由。
///
/// IPC では例外にせず、この値を結果として返す。
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(tag = "kind", rename_all = "camelCase")]
pub enum FileWriteError {
    /// 書き込みに失敗した(権限不足・ディレクトリ指定・親ディレクトリ欠損など)。
    WriteFailed {
        /// 書き込み対象のパス。
        path: String,
        /// OS が返す失敗理由。
        message: String,
    },
}

/// ファイル書き込みの結果。成功も失敗も値として返す。
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "camelCase")]
pub enum FileWriteResult {
    /// 対象パスへ内容を書き込めた。
    Ok,
    /// 書き込みに失敗した。
    Err {
        /// 失敗理由。
        error: FileWriteError,
    },
}

/// パスへ UTF-8 文字列をアトミックに書く。
///
/// 同一ディレクトリの一時ファイルへ書いてから rename で置き換える。
/// 失敗しても panic せず、[`FileWriteResult::Err`] を返す。
/// 失敗時は対象パスの既存内容を置き換えない。
///
/// # Arguments
///
/// * `path` - 書き込むファイルのパス。
/// * `contents` - 書き込む UTF-8 文字列。
pub fn write_utf8_file(path: &str, contents: &str) -> FileWriteResult {
    let target = Path::new(path);
    let Some(temp_path) = temp_path_in_same_dir(target) else {
        return write_failed(path, "path has no file name");
    };

    if let Err(err) = write_temp_then_rename(&temp_path, target, contents) {
        let _ = fs::remove_file(&temp_path);
        return write_failed(path, &err.to_string());
    }

    FileWriteResult::Ok
}

fn write_failed(path: &str, message: &str) -> FileWriteResult {
    FileWriteResult::Err {
        error: FileWriteError::WriteFailed {
            path: path.to_string(),
            message: message.to_string(),
        },
    }
}

fn temp_path_in_same_dir(target: &Path) -> Option<PathBuf> {
    let file_name = target.file_name()?;
    let parent = match target.parent() {
        Some(parent) if !parent.as_os_str().is_empty() => parent,
        _ => Path::new("."),
    };
    let nanos = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|duration| duration.as_nanos())
        .unwrap_or(0);
    Some(parent.join(format!(
        ".{}.tmp-{}-{}",
        file_name.to_string_lossy(),
        std::process::id(),
        nanos
    )))
}

fn write_temp_then_rename(temp_path: &Path, target: &Path, contents: &str) -> io::Result<()> {
    let mut file = File::create(temp_path)?;
    file.write_all(contents.as_bytes())?;
    file.sync_all()?;
    fs::rename(temp_path, target)
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

/// パスと UTF-8 文字列を受けてアトミックに書き込む。
///
/// Tauri の `Result<T, E>` にするとフロントエンド側で例外になるため、
/// 失敗も [`FileWriteResult`] の値として返す。
#[tauri::command]
fn write_file(path: &str, contents: &str) -> FileWriteResult {
    write_utf8_file(path, contents)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![greet, read_file, write_file])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[cfg(test)]
mod lib_test;
