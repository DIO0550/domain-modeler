use std::env;
use std::ffi::{OsStr, OsString};
use std::fs::{self, File};
use std::path::{Path, PathBuf};
use std::time::{SystemTime, UNIX_EPOCH};

/// 2つのパスが同じファイルを表すかを判定する。
///
/// 存在する最深の祖先を canonicalize してシンボリックリンクを解決する。
/// 末尾が存在しない場合の名前の同一性は、対象ディレクトリで実際に確認した規則に従う。
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
    matches!(
        file_names_are_equivalent(left_parent, left_name, right_name),
        Some(true)
    )
}

fn resolved_path(path: &Path) -> Option<PathBuf> {
    let mut ancestor = absolute_path(path)?;
    let mut missing_suffix: Vec<OsString> = Vec::new();
    let mut followed_link_count = 0;
    loop {
        if let Ok(mut resolved) = fs::canonicalize(&ancestor) {
            for component in missing_suffix.iter().rev() {
                resolved.push(component);
            }
            return Some(resolved);
        }
        if fs::symlink_metadata(&ancestor)
            .is_ok_and(|metadata| metadata.file_type().is_symlink())
        {
            if followed_link_count == MAX_SYMLINKS_TO_FOLLOW {
                return None;
            }
            followed_link_count += 1;
            let target = fs::read_link(&ancestor).ok()?;
            ancestor = if target.is_absolute() {
                target
            } else {
                ancestor.parent()?.join(target)
            };
            continue;
        }

        missing_suffix.push(ancestor.file_name()?.to_os_string());
        ancestor = ancestor.parent()?.to_path_buf();
    }
}

const MAX_SYMLINKS_TO_FOLLOW: usize = 40;

fn absolute_path(path: &Path) -> Option<PathBuf> {
    if path.is_absolute() {
        return Some(path.to_path_buf());
    }
    Some(env::current_dir().ok()?.join(path))
}

fn file_names_are_equivalent(
    directory: &Path,
    left_name: &OsStr,
    right_name: &OsStr,
) -> Option<bool> {
    let nanos = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|duration| duration.as_nanos())
        .unwrap_or(0);
    let probe_directory = directory.join(format!(
        ".domain-modeler-name-probe-{}-{}",
        std::process::id(),
        nanos
    ));
    fs::create_dir(&probe_directory).ok()?;
    let left_probe = probe_directory.join(left_name);
    let equivalent = File::options()
        .write(true)
        .create_new(true)
        .open(&left_probe)
        .ok()
        .map(|file| {
            drop(file);
            fs::metadata(probe_directory.join(right_name)).is_ok()
        });
    let _ = fs::remove_file(left_probe);
    let _ = fs::remove_dir(probe_directory);
    equivalent
}

#[cfg(test)]
mod file_path_test;
