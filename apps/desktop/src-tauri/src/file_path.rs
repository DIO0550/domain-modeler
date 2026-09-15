use std::env;
use std::ffi::OsString;
use std::fs::{self, File};
use std::path::{Path, PathBuf};
use std::time::{SystemTime, UNIX_EPOCH};

/// 2つのパスが同じファイルを表すかを判定する。
///
/// 存在する最深の祖先を canonicalize してシンボリックリンクを解決する。
/// 末尾が存在しない場合の大小文字は、対象ディレクトリで実際に確認した規則に従う。
pub fn same_file_path(left: &str, right: &str) -> bool {
    let Some(left_resolved) = resolved_path(Path::new(left)) else {
        return left == right;
    };
    let Some(right_resolved) = resolved_path(Path::new(right)) else {
        return left == right;
    };
    if left_resolved == right_resolved {
        return true;
    }

    let Some(left_parent) = left_resolved.parent() else {
        return false;
    };
    let Some(right_parent) = right_resolved.parent() else {
        return false;
    };
    if left_parent != right_parent {
        return false;
    }
    let Some(left_name) = left_resolved.file_name() else {
        return false;
    };
    let Some(right_name) = right_resolved.file_name() else {
        return false;
    };
    if left_name.to_string_lossy().to_lowercase()
        != right_name.to_string_lossy().to_lowercase()
    {
        return false;
    }

    matches!(directory_is_case_sensitive(left_parent), Some(false))
}

fn resolved_path(path: &Path) -> Option<PathBuf> {
    let absolute = absolute_path(path)?;
    let mut ancestor = absolute.as_path();
    let mut missing_suffix: Vec<OsString> = Vec::new();
    loop {
        if let Ok(mut resolved) = fs::canonicalize(ancestor) {
            for component in missing_suffix.iter().rev() {
                resolved.push(component);
            }
            return Some(resolved);
        }

        missing_suffix.push(ancestor.file_name()?.to_os_string());
        ancestor = ancestor.parent()?;
    }
}

fn absolute_path(path: &Path) -> Option<PathBuf> {
    if path.is_absolute() {
        return Some(path.to_path_buf());
    }
    Some(env::current_dir().ok()?.join(path))
}

fn directory_is_case_sensitive(directory: &Path) -> Option<bool> {
    let nanos = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|duration| duration.as_nanos())
        .unwrap_or(0);
    let prefix = format!(
        ".domain-modeler-case-probe-{}-{}",
        std::process::id(),
        nanos
    );
    let lower_path = directory.join(format!("{prefix}-a"));
    let upper_path = directory.join(format!("{prefix}-A"));
    let file = File::options()
        .write(true)
        .create_new(true)
        .open(&lower_path)
        .ok()?;
    drop(file);
    let is_case_sensitive = fs::metadata(&upper_path).is_err();
    let _ = fs::remove_file(&lower_path);
    Some(is_case_sensitive)
}

#[cfg(test)]
mod file_path_test;
