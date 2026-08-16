use std::fs::{self, File};
use std::io::{self, Write};
use std::path::{Path, PathBuf};
use std::time::{SystemTime, UNIX_EPOCH};

use serde::{Deserialize, Serialize};

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

#[cfg(test)]
mod file_write_test;
