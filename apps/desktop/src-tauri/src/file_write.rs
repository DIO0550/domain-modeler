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

/// 新規 .dmodel を作成する。既存ファイルやシンボリックリンクは置換しない。
/// 完全な内容を用意してから、対象パスを排他的に作成する。
pub fn create_dmodel_file(path: &str, contents: &str) -> FileWriteResult {
    let target = Path::new(path);
    if !target
        .extension()
        .and_then(|extension| extension.to_str())
        .is_some_and(|extension| extension.eq_ignore_ascii_case("dmodel"))
    {
        return write_failed(path, "保存先には新規 .dmodel ファイルを指定してください");
    }
    create_utf8_file(path, contents)
}

/// UTF-8 文書を排他的に新規作成する。既存ファイルやリンクは置換しない。
/// 完全な内容を一時ファイルへ書いて hard link で公開し、未対応のファイルシステムでは
/// create_new による排他的な直接作成へフォールバックする。
pub fn create_utf8_file(path: &str, contents: &str) -> FileWriteResult {
    let target = Path::new(path);
    let Some(temp_path) = temp_path_in_same_dir(target) else {
        return write_failed(path, "path has no file name");
    };
    let mut file = match File::options()
        .write(true)
        .create_new(true)
        .open(&temp_path)
    {
        Ok(file) => file,
        Err(error) => return write_failed(path, &error.to_string()),
    };
    let written = file.write_all(contents.as_bytes()).and_then(|()| file.sync_all());
    drop(file);
    if let Err(error) = written {
        let _ = fs::remove_file(&temp_path);
        return write_failed(path, &error.to_string());
    }

    match publish_new_file(&temp_path, target, contents) {
        Ok(()) => {
            let _ = fs::remove_file(&temp_path);
            FileWriteResult::Ok
        }
        Err(error) => {
            let _ = fs::remove_file(&temp_path);
            write_failed(path, &error.to_string())
        }
    }
}

fn publish_new_file(temp_path: &Path, target: &Path, contents: &str) -> io::Result<()> {
    publish_after_link(fs::hard_link(temp_path, target), target, contents)
}

fn publish_after_link(
    link_result: io::Result<()>,
    target: &Path,
    contents: &str,
) -> io::Result<()> {
    match link_result {
        Ok(()) => Ok(()),
        Err(error) if error.kind() == io::ErrorKind::AlreadyExists => Err(error),
        Err(_) => create_new_file(target, contents),
    }
}

fn create_new_file(target: &Path, contents: &str) -> io::Result<()> {
    let mut file = File::options().write(true).create_new(true).open(target)?;
    if let Err(error) = file
        .write_all(contents.as_bytes())
        .and_then(|()| file.sync_all())
    {
        drop(file);
        return Err(error);
    }
    Ok(())
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
    target.file_name()?;
    let parent = match target.parent() {
        Some(parent) if !parent.as_os_str().is_empty() => parent,
        _ => Path::new("."),
    };
    let nanos = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|duration| duration.as_nanos())
        .unwrap_or(0);
    Some(parent.join(format!(
        ".domain-modeler-tmp-{}-{}",
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
