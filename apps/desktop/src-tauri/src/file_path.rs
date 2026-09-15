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
    let left_path = crate::ipc_path::decode(left);
    let right_path = crate::ipc_path::decode(right);
    if left_path == right_path {
        return true;
    }
    let Some(left_resolved) = resolved_path(&left_path) else {
        return true;
    };
    let Some(right_resolved) = resolved_path(&right_path) else {
        return true;
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
    match same_directory(left_parent, right_parent) {
        Some(true) => {}
        Some(false) => return false,
        None => return true,
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
    let prefix = format!(".dm-probe-{}-{nanos:x}-", std::process::id());
    let (left_name, right_name) = compact_probe_names(left_name, right_name);
    let mut left_probe_name = OsString::from(&prefix);
    left_probe_name.push(&left_name);
    let mut right_probe_name = OsString::from(prefix);
    right_probe_name.push(&right_name);
    probe_file_names(
        &directory.join(left_probe_name),
        &directory.join(right_probe_name),
    )
}

/// コンポーネント長の上限を超えない範囲で、最初と最後の相違箇所を残す。
#[cfg(unix)]
fn compact_probe_names(left: &OsStr, right: &OsStr) -> (OsString, OsString) {
    use std::os::unix::ffi::{OsStrExt, OsStringExt};
    let (left, right) = compact_probe_units(left.as_bytes(), right.as_bytes(), b'-');
    (OsString::from_vec(left), OsString::from_vec(right))
}

#[cfg(windows)]
fn compact_probe_names(left: &OsStr, right: &OsStr) -> (OsString, OsString) {
    use std::os::windows::ffi::{OsStrExt, OsStringExt};
    let left = left.encode_wide().collect::<Vec<_>>();
    let right = right.encode_wide().collect::<Vec<_>>();
    let (left, right) = compact_probe_units(&left, &right, u16::from(b'-'));
    (OsString::from_wide(&left), OsString::from_wide(&right))
}

#[cfg(not(any(unix, windows)))]
fn compact_probe_names(left: &OsStr, right: &OsStr) -> (OsString, OsString) {
    let left = left.to_string_lossy().chars().collect::<Vec<_>>();
    let right = right.to_string_lossy().chars().collect::<Vec<_>>();
    let (left, right) = compact_probe_units(&left, &right, '-');
    (left.into_iter().collect(), right.into_iter().collect())
}

fn compact_probe_units<T: Copy + Eq>(
    left: &[T],
    right: &[T],
    separator: T,
) -> (Vec<T>, Vec<T>) {
    let common_start = left
        .iter()
        .zip(right)
        .take_while(|(left, right)| left == right)
        .count();
    let common_end = left
        .iter()
        .rev()
        .zip(right.iter().rev())
        .take_while(|(left, right)| left == right)
        .count();
    (
        compact_probe_units_for_name(left, common_start, common_end, separator),
        compact_probe_units_for_name(right, common_start, common_end, separator),
    )
}

fn compact_probe_units_for_name<T: Copy>(
    units: &[T],
    common_start: usize,
    common_end: usize,
    separator: T,
) -> Vec<T> {
    const CONTEXT: usize = 20;
    let first_start = common_start.saturating_sub(CONTEXT);
    let first_end = (common_start + CONTEXT).min(units.len());
    let last_difference = units.len().saturating_sub(common_end);
    let last_start = last_difference.saturating_sub(CONTEXT);
    let last_end = (last_difference + CONTEXT).min(units.len());
    let mut compact = units[first_start..first_end].to_vec();
    if last_start > first_end {
        compact.push(separator);
        compact.extend_from_slice(&units[last_start..last_end]);
    }
    compact
}

fn probe_file_names(left_probe: &Path, right_probe: &Path) -> Option<bool> {
    let left_file = open_probe(left_probe).ok()?;
    let right_result = open_probe(right_probe);
    let equivalent = match right_result {
        Err(error) if error.kind() == std::io::ErrorKind::AlreadyExists => {
            Some(true)
        }
        Ok(right_file) => {
            remove_probe_if_unchanged(right_probe, &right_file);
            Some(false)
        }
        Err(_) => None,
    };
    remove_probe_if_unchanged(left_probe, &left_file);
    equivalent
}

fn open_probe(path: &Path) -> std::io::Result<File> {
    let mut options = File::options();
    options.write(true).create_new(true);
    #[cfg(windows)]
    {
        use std::os::windows::fs::OpenOptionsExt;
        const FILE_FLAG_DELETE_ON_CLOSE: u32 = 0x0400_0000;
        options.custom_flags(FILE_FLAG_DELETE_ON_CLOSE);
    }
    options.open(path)
}

#[cfg(unix)]
fn remove_probe_if_unchanged(path: &Path, file: &File) {
    let Ok(opened) = file.metadata() else {
        return;
    };
    let Ok(current) = fs::metadata(path) else {
        return;
    };
    if opened.dev() == current.dev() && opened.ino() == current.ino() {
        let _ = fs::remove_file(path);
    }
}

#[cfg(windows)]
fn remove_probe_if_unchanged(_path: &Path, file: &File) {
    // FILE_FLAG_DELETE_ON_CLOSE removes the opened file object even if its name is replaced.
    let _ = file;
}

#[cfg(not(any(unix, windows)))]
fn remove_probe_if_unchanged(_path: &Path, _file: &File) {
    // An unknown platform has no identity-safe cleanup primitive here. Leave the probe in place.
}

#[cfg(unix)]
fn same_directory(left: &Path, right: &Path) -> Option<bool> {
    if left == right {
        return Some(true);
    }
    let Ok(left_metadata) = fs::metadata(left) else {
        return None;
    };
    let Ok(right_metadata) = fs::metadata(right) else {
        return None;
    };
    Some(
        left_metadata.dev() == right_metadata.dev()
            && left_metadata.ino() == right_metadata.ino(),
    )
}

#[cfg(not(unix))]
fn same_directory(left: &Path, right: &Path) -> Option<bool> {
    Some(left == right)
}

#[cfg(test)]
mod file_path_test;
