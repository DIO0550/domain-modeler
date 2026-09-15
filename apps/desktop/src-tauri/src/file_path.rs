use std::env;
use std::fs;
use std::path::{Component, Path, PathBuf};

/// 2つのパスが同じファイルを表すかを判定する。
///
/// 両方が存在する場合は canonicalize でシンボリックリンクも解決する。
/// 削除済みの編集中ファイルでは、正規化した絶対パスをOS既定の大小文字規則で比較する。
pub fn same_file_path(left: &str, right: &str) -> bool {
    let left_path = Path::new(left);
    let right_path = Path::new(right);
    if let (Ok(left_canonical), Ok(right_canonical)) =
        (fs::canonicalize(left_path), fs::canonicalize(right_path))
    {
        return paths_equal(&left_canonical, &right_canonical);
    }

    match (normalized_absolute(left_path), normalized_absolute(right_path)) {
        (Some(left_normalized), Some(right_normalized)) => {
            paths_equal(&left_normalized, &right_normalized)
        }
        _ => paths_equal(left_path, right_path),
    }
}

fn normalized_absolute(path: &Path) -> Option<PathBuf> {
    let absolute = if path.is_absolute() {
        path.to_path_buf()
    } else {
        env::current_dir().ok()?.join(path)
    };
    let mut normalized = PathBuf::new();
    for component in absolute.components() {
        match component {
            Component::CurDir => {}
            Component::ParentDir => {
                normalized.pop();
            }
            other => normalized.push(other.as_os_str()),
        }
    }
    Some(normalized)
}

#[cfg(any(target_os = "windows", target_os = "macos"))]
fn paths_equal(left: &Path, right: &Path) -> bool {
    left.to_string_lossy().to_lowercase() == right.to_string_lossy().to_lowercase()
}

#[cfg(not(any(target_os = "windows", target_os = "macos")))]
fn paths_equal(left: &Path, right: &Path) -> bool {
    left == right
}

#[cfg(test)]
mod file_path_test;
