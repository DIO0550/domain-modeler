use std::env;
use std::ffi::{OsStr, OsString};
use std::fs::{self, File};
use std::path::{Path, PathBuf};
use std::sync::atomic::{AtomicU64, Ordering};
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
    for _ in 0..MAX_PROBE_ALLOCATION_ATTEMPTS {
        let nanos = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .map(|duration| duration.as_nanos())
            .unwrap_or(0);
        let nonce = PROBE_NONCE.fetch_add(1, Ordering::Relaxed);
        let probe_directory = directory.join(format!(
            ".dm-probe-{}-{nanos:x}-{nonce:x}",
            std::process::id(),
        ));
        match fs::create_dir(&probe_directory) {
            Ok(()) => {}
            Err(error) if error.kind() == std::io::ErrorKind::AlreadyExists => continue,
            Err(_) => return None,
        }
        match probe_file_names(
            &probe_directory.join(left_name),
            &probe_directory.join(right_name),
        ) {
            ProbeResult::Determined(equivalent) => return Some(equivalent),
            ProbeResult::RetryAllocation => {}
            ProbeResult::Indeterminate => return None,
        }
    }
    None
}

static PROBE_NONCE: AtomicU64 = AtomicU64::new(0);
const MAX_PROBE_ALLOCATION_ATTEMPTS: usize = 16;

#[derive(Debug, PartialEq, Eq)]
enum ProbeResult {
    Determined(bool),
    RetryAllocation,
    Indeterminate,
}

fn probe_file_names(left_probe: &Path, right_probe: &Path) -> ProbeResult {
    let left_file = match open_probe(left_probe) {
        Ok(file) => file,
        Err(error) if error.kind() == std::io::ErrorKind::AlreadyExists => {
            return ProbeResult::RetryAllocation;
        }
        Err(_) => return ProbeResult::Indeterminate,
    };
    let right_result = open_probe(right_probe);
    let result = match right_result {
        Err(error) if error.kind() == std::io::ErrorKind::AlreadyExists => {
            ProbeResult::Determined(true)
        }
        Ok(right_file) => {
            remove_probe_if_unchanged(right_probe, &right_file);
            ProbeResult::Determined(false)
        }
        Err(_) => ProbeResult::Indeterminate,
    };
    remove_probe_if_unchanged(left_probe, &left_file);
    result
}

fn open_probe(path: &Path) -> std::io::Result<File> {
    let mut options = File::options();
    options.write(true).create_new(true);
    #[cfg(windows)]
    {
        use std::os::windows::fs::OpenOptionsExt;
        const DELETE: u32 = 0x0001_0000;
        const FILE_FLAG_DELETE_ON_CLOSE: u32 = 0x0400_0000;
        const GENERIC_WRITE: u32 = 0x4000_0000;
        options.access_mode(GENERIC_WRITE | DELETE);
        options.custom_flags(FILE_FLAG_DELETE_ON_CLOSE);
    }
    options.open(path)
}

#[cfg(unix)]
fn remove_probe_if_unchanged(path: &Path, file: &File) {
    // POSIX には開いた通常ファイルを identity-safe に unlink する可搬APIがない。
    // metadata 確認後の pathname unlink も置換競合を残すため、別 inode を消すより
    // 一意な隠しプローブを残す方を選ぶ。
    let _ = (path, file);
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
