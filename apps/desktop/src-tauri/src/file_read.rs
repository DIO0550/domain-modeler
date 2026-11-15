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
    let decoded = crate::ipc_path::decode(path);

    read_utf8_path(&decoded, path)
}

/// IPC から渡された文書パスのファイルを UTF-8 文字列として読む。
///
/// `.dcanvas` / `.dmodel` 以外の拡張子は拒否する。
pub fn read_document_file(path: &str) -> FileReadResult {
    let decoded = crate::ipc_path::decode(path);

    if !crate::file_dialog::is_document_path(&decoded) {
        return FileReadResult::Err {
            error: FileReadError::ReadFailed {
                path: path.to_string(),
                message: "対応していない拡張子です(.dcanvas / .dmodel のみ読み込めます)"
                    .to_string(),
            },
        };
    }

    read_utf8_path(&decoded, path)
}

fn read_utf8_path(decoded: &std::path::Path, reported_path: &str) -> FileReadResult {
    match fs::read(decoded) {
        Err(err) if err.kind() == ErrorKind::NotFound => FileReadResult::Err {
            error: FileReadError::NotFound {
                path: reported_path.to_string(),
            },
        },
        Err(err) => FileReadResult::Err {
            error: FileReadError::ReadFailed {
                path: reported_path.to_string(),
                message: err.to_string(),
            },
        },
        Ok(bytes) => match String::from_utf8(bytes) {
            Ok(value) => FileReadResult::Ok { value },
            Err(_) => FileReadResult::Err {
                error: FileReadError::InvalidUtf8 {
                    path: reported_path.to_string(),
                },
            },
        },
    }
}

#[cfg(test)]
mod file_read_test;
