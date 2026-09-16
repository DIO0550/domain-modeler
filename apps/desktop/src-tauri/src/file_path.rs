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
    let normalizes_unicode = probe_file_names_in_directory(
        directory,
        OsStr::new("é"),
        OsStr::new("e\u{301}"),
    )?;
    if normalizes_unicode {
        if let (Some(left), Some(right)) = (left_name.to_str(), right_name.to_str()) {
            return unicode_file_names_are_equivalent(directory, left, right);
        }
    }
    let left_chunks = probe_name_chunks(left_name);
    let right_chunks = probe_name_chunks(right_name);
    let chunk_count = left_chunks.len().max(right_chunks.len());
    for index in 0..chunk_count {
        let left = left_chunks
            .get(index)
            .map_or(OsStr::new(""), OsString::as_os_str);
        let right = right_chunks
            .get(index)
            .map_or(OsStr::new(""), OsString::as_os_str);
        if !probe_file_names_in_directory(directory, left, right)? {
            return Some(false);
        }
    }
    Some(true)
}

/// Unicode正規化を行うファイルシステム上で、長い名前を実測可能な境界へ分割する。
///
/// 正規化済み文字列をアプリ側で生成せず、左右の部分文字列がファイルシステム上で
/// 同じ名前になる最長の境界を探す。結合文字やHangulの合成単位を途中で分断せず、
/// 追加のproduction依存も持たない。
fn unicode_file_names_are_equivalent(
    directory: &Path,
    left: &str,
    right: &str,
) -> Option<bool> {
    let mut left_start = 0;
    let mut right_start = 0;
    let mut remaining_comparisons = MAX_NORMALIZATION_PROBE_COMPARISONS;
    while left_start < left.len() || right_start < right.len() {
        if left_start == left.len() || right_start == right.len() {
            return Some(false);
        }
        let left_ends = probe_chunk_ends(left, left_start);
        let right_ends = probe_chunk_ends(right, right_start);
        let mut matched = None;
        let right_candidates = right_ends
            .iter()
            .rev()
            .map(|end| (*end, OsString::from(&right[right_start..*end])))
            .collect::<Vec<_>>();
        for left_end in left_ends.iter().rev() {
            if remaining_comparisons == 0 {
                return None;
            }
            let candidate_count = right_candidates.len().min(remaining_comparisons);
            remaining_comparisons -= candidate_count;
            if let Some(right_end) = find_equivalent_name_in_directory(
                directory,
                OsStr::new(&left[left_start..*left_end]),
                &right_candidates[..candidate_count],
            )? {
                matched = Some((*left_end, right_end));
                break;
            }
            if candidate_count < right_candidates.len() {
                return None;
            }
        }
        let Some((left_end, right_end)) = matched else {
            return Some(false);
        };
        left_start = left_end;
        right_start = right_end;
    }
    Some(true)
}

fn probe_chunk_ends(value: &str, start: usize) -> Vec<usize> {
    let mut ends = Vec::new();
    let mut units = 0;
    for (offset, character) in value[start..].char_indices() {
        let next_units = units + probe_character_units(character);
        if next_units > MAX_PROBE_CHUNK_UNITS {
            break;
        }
        units = next_units;
        ends.push(start + offset + character.len_utf8());
    }
    ends
}

#[cfg(windows)]
fn probe_character_units(character: char) -> usize {
    character.len_utf16()
}

#[cfg(not(windows))]
fn probe_character_units(character: char) -> usize {
    character.len_utf8()
}

fn probe_file_names_in_directory(
    directory: &Path,
    left_name: &OsStr,
    right_name: &OsStr,
) -> Option<bool> {
    let candidates = [(0, right_name.to_os_string())];
    find_equivalent_name_in_directory(directory, left_name, &candidates)
        .map(|matched| matched.is_some())
}

fn find_equivalent_name_in_directory(
    directory: &Path,
    left_name: &OsStr,
    right_names: &[(usize, OsString)],
) -> Option<Option<usize>> {
    for _ in 0..MAX_PROBE_ALLOCATION_ATTEMPTS {
        let prefix = next_probe_prefix();
        let mut left_probe = OsString::from(&prefix);
        left_probe.push(left_name);
        let left_path = directory.join(left_probe);
        let left_file = match open_probe(&left_path) {
            Ok(file) => file,
            Err(error) if error.kind() == std::io::ErrorKind::AlreadyExists => continue,
            Err(_) => return None,
        };
        let mut matched = None;
        for (key, right_name) in right_names {
            let mut right_probe = OsString::from(&prefix);
            right_probe.push(right_name);
            match existing_probe_matches(&left_file, &directory.join(right_probe)) {
                ExistingProbeResult::Equivalent => {
                    matched = Some(*key);
                    break;
                }
                ExistingProbeResult::Different => {}
                ExistingProbeResult::Indeterminate => {
                    remove_probe_if_unchanged(&left_path, &left_file);
                    return None;
                }
            }
        }
        remove_probe_if_unchanged(&left_path, &left_file);
        return Some(matched);
    }
    None
}

fn next_probe_prefix() -> String {
    let nanos = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|duration| duration.as_nanos())
        .unwrap_or(0);
    let nonce = PROBE_NONCE.fetch_add(1, Ordering::Relaxed);
    format!(".dm-probe-{}-{nanos:x}-{nonce:x}-", std::process::id())
}

#[cfg(unix)]
fn probe_name_chunks(name: &OsStr) -> Vec<OsString> {
    use std::os::unix::ffi::{OsStrExt, OsStringExt};

    if let Ok(value) = std::str::from_utf8(name.as_bytes()) {
        return utf8_probe_chunks(value)
            .into_iter()
            .map(OsString::from)
            .collect();
    }
    name.as_bytes()
        .chunks(MAX_PROBE_CHUNK_UNITS)
        .map(|chunk| OsString::from_vec(chunk.to_vec()))
        .collect()
}

#[cfg(windows)]
fn probe_name_chunks(name: &OsStr) -> Vec<OsString> {
    use std::os::windows::ffi::{OsStrExt, OsStringExt};

    let units = name.encode_wide().collect::<Vec<_>>();
    if let Ok(value) = String::from_utf16(&units) {
        return utf16_probe_chunks(&value)
            .into_iter()
            .map(|chunk| OsString::from_wide(&chunk))
            .collect();
    }
    units
        .chunks(MAX_PROBE_CHUNK_UNITS)
        .map(OsString::from_wide)
        .collect()
}

#[cfg(not(any(unix, windows)))]
fn probe_name_chunks(name: &OsStr) -> Vec<OsString> {
    let value = name.to_string_lossy();
    utf8_probe_chunks(&value)
        .into_iter()
        .map(OsString::from)
        .collect()
}

fn utf8_probe_chunks(value: &str) -> Vec<String> {
    let mut chunks = Vec::new();
    let mut current = String::new();
    for character in value.chars() {
        if current.len() + character.len_utf8() > MAX_PROBE_CHUNK_UNITS {
            chunks.push(current);
            current = String::new();
        }
        current.push(character);
    }
    if !current.is_empty() {
        chunks.push(current);
    }
    chunks
}

#[cfg(windows)]
fn utf16_probe_chunks(value: &str) -> Vec<Vec<u16>> {
    let mut chunks = Vec::new();
    let mut current = Vec::new();
    for character in value.chars() {
        let mut encoded = [0; 2];
        let units = character.encode_utf16(&mut encoded);
        if current.len() + units.len() > MAX_PROBE_CHUNK_UNITS {
            chunks.push(current);
            current = Vec::new();
        }
        current.extend_from_slice(units);
    }
    if !current.is_empty() {
        chunks.push(current);
    }
    chunks
}

static PROBE_NONCE: AtomicU64 = AtomicU64::new(0);
const MAX_PROBE_ALLOCATION_ATTEMPTS: usize = 16;
const MAX_PROBE_CHUNK_UNITS: usize = 160;
const MAX_NORMALIZATION_PROBE_COMPARISONS: usize = 256;

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
    let result = match existing_probe_matches(&left_file, right_probe) {
        ExistingProbeResult::Equivalent => ProbeResult::Determined(true),
        ExistingProbeResult::Different => ProbeResult::Determined(false),
        ExistingProbeResult::Indeterminate => ProbeResult::Indeterminate,
    };
    remove_probe_if_unchanged(left_probe, &left_file);
    result
}

#[derive(Debug, PartialEq, Eq)]
enum ExistingProbeResult {
    Equivalent,
    Different,
    Indeterminate,
}

fn existing_probe_matches(left_file: &File, right_probe: &Path) -> ExistingProbeResult {
    let right_file = match File::options().read(true).open(right_probe) {
        Ok(file) => file,
        Err(error) if error.kind() == std::io::ErrorKind::NotFound => {
            return ExistingProbeResult::Different;
        }
        Err(_) => return ExistingProbeResult::Indeterminate,
    };
    if same_open_file(left_file, &right_file) {
        ExistingProbeResult::Equivalent
    } else {
        ExistingProbeResult::Indeterminate
    }
}

#[cfg(unix)]
fn same_open_file(left: &File, right: &File) -> bool {
    let (Ok(left), Ok(right)) = (left.metadata(), right.metadata()) else {
        return false;
    };
    left.dev() == right.dev() && left.ino() == right.ino()
}

#[cfg(windows)]
fn same_open_file(left: &File, right: &File) -> bool {
    use std::os::windows::fs::MetadataExt;

    let (Ok(left), Ok(right)) = (left.metadata(), right.metadata()) else {
        return false;
    };
    left.volume_serial_number() == right.volume_serial_number()
        && left.file_index() == right.file_index()
}

#[cfg(not(any(unix, windows)))]
fn same_open_file(_left: &File, _right: &File) -> bool {
    true
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

#[cfg(windows)]
fn same_directory(left: &Path, right: &Path) -> Option<bool> {
    use std::os::windows::fs::OpenOptionsExt;

    const FILE_FLAG_BACKUP_SEMANTICS: u32 = 0x0200_0000;
    const FILE_SHARE_READ: u32 = 0x0000_0001;
    const FILE_SHARE_WRITE: u32 = 0x0000_0002;
    const FILE_SHARE_DELETE: u32 = 0x0000_0004;
    let open = |path: &Path| {
        File::options()
            .read(true)
            .share_mode(FILE_SHARE_READ | FILE_SHARE_WRITE | FILE_SHARE_DELETE)
            .custom_flags(FILE_FLAG_BACKUP_SEMANTICS)
            .open(path)
    };
    let (Ok(left), Ok(right)) = (open(left), open(right)) else {
        return None;
    };
    Some(same_open_file(&left, &right))
}

#[cfg(not(any(unix, windows)))]
fn same_directory(left: &Path, right: &Path) -> Option<bool> {
    Some(left == right)
}

#[cfg(test)]
mod file_path_test;
