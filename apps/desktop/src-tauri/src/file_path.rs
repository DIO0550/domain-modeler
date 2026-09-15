use std::env;
use std::ffi::{OsStr, OsString};
use std::fs::{self, File};
use std::path::{Path, PathBuf};
use std::time::{SystemTime, UNIX_EPOCH};

#[cfg(unix)]
use std::os::unix::fs::MetadataExt;

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
    if !same_directory(left_parent, right_parent) {
        return false;
    }
    let Some(left_name) = left_resolved.file_name() else {
        return false;
    };
    let Some(right_name) = right_resolved.file_name() else {
        return false;
    };
    file_names_are_equivalent(left_parent, left_name, right_name)
        .unwrap_or(true)
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
    let prefix = format!(
        ".domain-modeler-name-probe-{}-{}-",
        std::process::id(),
        nanos
    );
    let mut left_probe_name = OsString::from(&prefix);
    left_probe_name.push(left_name);
    let mut right_probe_name = OsString::from(prefix);
    right_probe_name.push(right_name);
    let direct_result = probe_file_names(
        &directory.join(left_probe_name),
        &directory.join(right_probe_name),
    );
    if direct_result.is_some() {
        return direct_result;
    }

    probe_file_names_in_temporary_directory(directory, left_name, right_name, nanos)
}

fn probe_file_names(left_probe: &Path, right_probe: &Path) -> Option<bool> {
    let left_file = File::options()
        .write(true)
        .create_new(true)
        .open(left_probe)
        .ok()?;
    let right_result = File::options()
        .write(true)
        .create_new(true)
        .open(right_probe);
    let equivalent = match right_result {
        Err(error) if error.kind() == std::io::ErrorKind::AlreadyExists => {
            Some(true)
        }
        Ok(right_file) => {
            drop(right_file);
            let _ = fs::remove_file(right_probe);
            Some(false)
        }
        Err(_) => None,
    };
    drop(left_file);
    let _ = fs::remove_file(left_probe);
    equivalent
}

fn probe_file_names_in_temporary_directory(
    directory: &Path,
    left_name: &OsStr,
    right_name: &OsStr,
    nanos: u128,
) -> Option<bool> {
    let probe_directory = directory.join(format!(
        ".domain-modeler-name-probe-{}-{}",
        std::process::id(),
        nanos
    ));
    fs::create_dir(&probe_directory).ok()?;
    let left_probe = probe_directory.join(left_name);
    let equivalent = probe_file_names(&left_probe, &probe_directory.join(right_name));
    let _ = fs::remove_dir(probe_directory);
    equivalent
}

#[cfg(unix)]
fn same_directory(left: &Path, right: &Path) -> bool {
    if left == right {
        return true;
    }
    let Ok(left_metadata) = fs::metadata(left) else {
        return false;
    };
    let Ok(right_metadata) = fs::metadata(right) else {
        return false;
    };
    left_metadata.dev() == right_metadata.dev()
        && left_metadata.ino() == right_metadata.ino()
}

#[cfg(not(unix))]
fn same_directory(left: &Path, right: &Path) -> bool {
    left == right
}

#[cfg(test)]
mod file_path_test;
