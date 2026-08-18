use std::collections::HashMap;
use std::fs;
use std::path::{Path, PathBuf};
use std::sync::mpsc::{self, RecvTimeoutError};
use std::sync::{Mutex, MutexGuard};
use std::thread::{self, JoinHandle};
use std::time::{Duration, Instant};

use notify::event::EventKind;
use notify::{Config, Event, RecommendedWatcher, RecursiveMode, Watcher};
use serde::{Deserialize, Serialize};

/// 変更イベントをまとめてからフロントエンドへ送る待ち時間。
pub const DEBOUNCE: Duration = Duration::from_millis(200);

/// フロントエンドが購読するファイル監視イベント名。
pub const FILE_WATCH_EVENT: &str = "file-watch";

/// デバウンス後にフロントエンドへ送る監視イベント。
///
/// 読み込みや取り込みの判断はフロントエンド側の責務。
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "camelCase")]
pub enum FileWatchEvent {
    /// 対象パスの内容が変わった、または削除後に再出現した。
    Changed {
        /// 監視開始時に渡されたパス。
        path: String,
    },
    /// 対象パスのファイルが無い。
    Deleted {
        /// 監視開始時に渡されたパス。
        path: String,
    },
}

impl FileWatchEvent {
    /// デバウンス後のファイル有無から送出イベントを決める。
    pub(crate) fn from_exists(path: &str, exists: bool) -> Self {
        if exists {
            Self::Changed {
                path: path.to_string(),
            }
        } else {
            Self::Deleted {
                path: path.to_string(),
            }
        }
    }
}

/// ファイル監視の失敗理由。
///
/// IPC では例外にせず、この値を結果として返す。
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(tag = "kind", rename_all = "camelCase")]
pub enum FileWatchError {
    /// 監視の開始に失敗した(親ディレクトリ欠損・権限不足など)。
    WatchFailed {
        /// 監視対象のパス。
        path: String,
        /// OS が返す失敗理由。
        message: String,
    },
}

/// 監視開始・停止の結果。成功も失敗も値として返す。
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "camelCase")]
pub enum FileWatchResult {
    /// 監視を開始または停止できた。
    Ok,
    /// 監視の開始に失敗した。
    Err {
        /// 失敗理由。
        error: FileWatchError,
    },
}

/// 開いている文書パスごとのファイル監視。
pub struct FileWatchRegistry {
    sessions: Mutex<HashMap<String, WatchSession>>,
}

struct WatchSession {
    watcher: Option<RecommendedWatcher>,
    stop_tx: Option<mpsc::Sender<WatchMsg>>,
    thread: Option<JoinHandle<()>>,
}

enum WatchMsg {
    Fs(notify::Result<Event>),
    Stop,
}

impl Default for FileWatchRegistry {
    fn default() -> Self {
        Self::new()
    }
}

impl FileWatchRegistry {
    /// 空の監視レジストリを作る。
    pub fn new() -> Self {
        Self {
            sessions: Mutex::new(HashMap::new()),
        }
    }

    /// 対象パスの監視を始める。
    ///
    /// 親ディレクトリを監視し、対象ファイルのイベントだけを拾う。
    /// ファイルが無くても親があれば開始でき、再出現は変更イベントになる。
    /// 同じパスを再度開始しても追加の監視は作らない。
    ///
    /// # Arguments
    ///
    /// * `path` - 監視するファイルのパス。
    /// * `on_event` - デバウンス後の変更・削除イベントを受け取る関数。
    pub fn start(
        &self,
        path: &str,
        on_event: impl Fn(FileWatchEvent) + Send + 'static,
    ) -> FileWatchResult {
        if self.sessions().contains_key(path) {
            return FileWatchResult::Ok;
        }

        let (parent, target) = match watch_target(path) {
            Ok(resolved) => resolved,
            Err(message) => return watch_failed(path, &message),
        };

        let (tx, rx) = mpsc::channel();
        let watcher_tx = tx.clone();
        let mut watcher = match RecommendedWatcher::new(
            move |result| {
                let _ = watcher_tx.send(WatchMsg::Fs(result));
            },
            Config::default(),
        ) {
            Ok(watcher) => watcher,
            Err(err) => return watch_failed(path, &err.to_string()),
        };

        if let Err(err) = watcher.watch(&parent, RecursiveMode::NonRecursive) {
            return watch_failed(path, &err.to_string());
        }

        let original_path = path.to_string();
        let thread = match thread::Builder::new()
            .name("domain-modeler-file-watch".into())
            .spawn(move || debounce_loop(original_path, target, rx, on_event))
        {
            Ok(thread) => thread,
            Err(err) => return watch_failed(path, &err.to_string()),
        };

        let session = WatchSession {
            watcher: Some(watcher),
            stop_tx: Some(tx),
            thread: Some(thread),
        };

        let mut sessions = self.sessions();
        if sessions.contains_key(path) {
            drop(sessions);
            drop(session);
            return FileWatchResult::Ok;
        }
        sessions.insert(path.to_string(), session);
        FileWatchResult::Ok
    }

    /// 対象パスの監視を止める。
    ///
    /// 監視していなかったパスでも成功として返す。
    ///
    /// # Arguments
    ///
    /// * `path` - 監視を止めるファイルのパス。
    pub fn stop(&self, path: &str) -> FileWatchResult {
        let session = self.sessions().remove(path);
        drop(session);
        FileWatchResult::Ok
    }

    fn sessions(&self) -> MutexGuard<'_, HashMap<String, WatchSession>> {
        self.sessions
            .lock()
            .unwrap_or_else(std::sync::PoisonError::into_inner)
    }
}

impl Drop for WatchSession {
    fn drop(&mut self) {
        if let Some(stop_tx) = self.stop_tx.take() {
            let _ = stop_tx.send(WatchMsg::Stop);
        }
        drop(self.watcher.take());
        if let Some(thread) = self.thread.take() {
            let _ = thread.join();
        }
    }
}

fn watch_failed(path: &str, message: &str) -> FileWatchResult {
    FileWatchResult::Err {
        error: FileWatchError::WatchFailed {
            path: path.to_string(),
            message: message.to_string(),
        },
    }
}

fn watch_target(path: &str) -> Result<(PathBuf, PathBuf), String> {
    let path = Path::new(path);
    let file_name = path
        .file_name()
        .ok_or_else(|| "path has no file name".to_string())?;
    let parent = match path.parent() {
        Some(parent) if !parent.as_os_str().is_empty() => parent,
        _ => Path::new("."),
    };
    let canonical_parent = fs::canonicalize(parent).map_err(|err| err.to_string())?;
    Ok((canonical_parent.clone(), canonical_parent.join(file_name)))
}

fn debounce_loop(
    original_path: String,
    target: PathBuf,
    rx: mpsc::Receiver<WatchMsg>,
    on_event: impl Fn(FileWatchEvent),
) {
    let mut deadline: Option<Instant> = None;
    loop {
        let now = Instant::now();
        if deadline.is_some_and(|due| due <= now) {
            deadline = None;
            on_event(FileWatchEvent::from_exists(&original_path, target.exists()));
            continue;
        }

        let msg = match deadline {
            Some(due) => match rx.recv_timeout(due.saturating_duration_since(now)) {
                Ok(msg) => msg,
                Err(RecvTimeoutError::Timeout) => {
                    deadline = None;
                    on_event(FileWatchEvent::from_exists(&original_path, target.exists()));
                    continue;
                }
                Err(RecvTimeoutError::Disconnected) => break,
            },
            None => match rx.recv() {
                Ok(msg) => msg,
                Err(_) => break,
            },
        };

        match msg {
            WatchMsg::Stop => break,
            WatchMsg::Fs(Ok(event))
                if affects_target(&event, &target) && is_relevant(event.kind) =>
            {
                deadline = Some(Instant::now() + DEBOUNCE);
            }
            WatchMsg::Fs(_) => {}
        }
    }
}

fn affects_target(event: &Event, target: &Path) -> bool {
    let Some(target_name) = target.file_name() else {
        return false;
    };
    let target_parent = target.parent();
    event
        .paths
        .iter()
        .any(|path| path.file_name() == Some(target_name) && path.parent() == target_parent)
}

fn is_relevant(kind: EventKind) -> bool {
    matches!(
        kind,
        EventKind::Any
            | EventKind::Other
            | EventKind::Create(_)
            | EventKind::Modify(_)
            | EventKind::Remove(_)
    )
}

#[cfg(test)]
mod file_watch_test;
