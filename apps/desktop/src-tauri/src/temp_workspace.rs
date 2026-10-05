use std::env;
use std::fs;
use std::path::{Path, PathBuf};
use std::sync::atomic::{AtomicU64, Ordering};
use std::time::{SystemTime, UNIX_EPOCH};

static WORKSPACE_NONCE: AtomicU64 = AtomicU64::new(0);

pub(crate) struct TempWorkspace {
    dir: PathBuf,
}

impl TempWorkspace {
    pub(crate) fn create() -> Self {
        let nanos = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .expect("system clock is after unix epoch")
            .as_nanos();

        loop {
            let nonce = WORKSPACE_NONCE.fetch_add(1, Ordering::Relaxed);
            let dir = env::temp_dir().join(format!(
                "domain-modeler-file-io-{}-{nanos}-{nonce}",
                std::process::id(),
            ));

            match fs::create_dir(&dir) {
                Ok(()) => return Self { dir },
                Err(error) if error.kind() == std::io::ErrorKind::AlreadyExists => continue,
                Err(error) => panic!("temp workspace should be created: {error}"),
            }
        }
    }

    pub(crate) fn dir(&self) -> &Path {
        &self.dir
    }

    pub(crate) fn path(&self, name: &str) -> PathBuf {
        self.dir.join(name)
    }

    pub(crate) fn entry_names(&self) -> Vec<String> {
        let mut names: Vec<String> = fs::read_dir(&self.dir)
            .expect("workspace should be readable")
            .map(|entry| {
                entry
                    .expect("directory entry should be readable")
                    .file_name()
                    .to_string_lossy()
                    .into_owned()
            })
            .collect();

        names.sort();

        names
    }
}

impl Drop for TempWorkspace {
    fn drop(&mut self) {
        let _ = fs::remove_dir_all(&self.dir);
    }
}

#[cfg(test)]
mod tests {
    use super::TempWorkspace;
    use std::collections::HashSet;
    use std::thread;

    #[test]
    fn 並列に作成した作業領域は互いに異なる() {
        let workspaces = thread::scope(|scope| {
            let handles = (0..32)
                .map(|_| scope.spawn(TempWorkspace::create))
                .collect::<Vec<_>>();

            handles
                .into_iter()
                .map(|handle| handle.join().unwrap())
                .collect::<Vec<_>>()
        });
        let paths = workspaces
            .iter()
            .map(TempWorkspace::dir)
            .collect::<HashSet<_>>();

        assert_eq!(paths.len(), workspaces.len());
    }
}

/// テスト終了時にディレクトリのパーミッションを戻す。
#[cfg(unix)]
pub(crate) struct RestoredPermissions {
    path: PathBuf,
    permissions: fs::Permissions,
}

#[cfg(unix)]
impl RestoredPermissions {
    /// ディレクトリを読み取り専用にして、Drop で元に戻す。
    ///
    /// # Arguments
    ///
    /// * `path` - 読み取り専用にするディレクトリ。
    pub(crate) fn make_dir_readonly(path: &Path) -> Self {
        use std::os::unix::fs::PermissionsExt;

        let original_permissions = fs::metadata(path)
            .expect("directory metadata should be readable")
            .permissions();
        let restore = Self {
            path: path.to_path_buf(),
            permissions: original_permissions.clone(),
        };
        let mut readonly = original_permissions;

        readonly.set_mode(0o555);
        fs::set_permissions(path, readonly).expect("directory should become read-only");

        restore
    }
}

#[cfg(unix)]
impl Drop for RestoredPermissions {
    fn drop(&mut self) {
        let _ = fs::set_permissions(&self.path, self.permissions.clone());
    }
}
