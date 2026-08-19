use std::fs;
use std::sync::mpsc::{self, Receiver};
use std::thread;
use std::time::Duration;

use super::{FileWatchEvent, FileWatchRegistry, FileWatchResult, DEBOUNCE};
use crate::temp_workspace::TempWorkspace;

#[test]
fn デバウンス後にファイルがあると変更イベントになる() {
    assert_eq!(
        FileWatchEvent::from_exists("/tmp/note.dmodel", true),
        FileWatchEvent::Changed {
            path: "/tmp/note.dmodel".to_string(),
        }
    );
}

#[test]
fn デバウンス後にファイルが無いと削除イベントになる() {
    assert_eq!(
        FileWatchEvent::from_exists("/tmp/note.dmodel", false),
        FileWatchEvent::Deleted {
            path: "/tmp/note.dmodel".to_string(),
        }
    );
}

#[test]
fn 変更イベントはjsonでtypeがchangedになる() {
    let event = FileWatchEvent::Changed {
        path: "/tmp/board.dcanvas".to_string(),
    };

    let json = serde_json::to_value(&event).expect("event should serialize");

    assert_eq!(json["type"], "changed");
    assert_eq!(json["path"], "/tmp/board.dcanvas");
}

#[test]
fn 削除イベントはjsonでtypeがdeletedになる() {
    let event = FileWatchEvent::Deleted {
        path: "/tmp/board.dcanvas".to_string(),
    };

    let json = serde_json::to_value(&event).expect("event should serialize");

    assert_eq!(json["type"], "deleted");
    assert_eq!(json["path"], "/tmp/board.dcanvas");
}

#[test]
fn ファイル内容が変わると変更イベントが返る() {
    let workspace = TempWorkspace::create();
    let path = workspace.path("note.dmodel");
    fs::write(&path, "data 注文 = string\n").expect("fixture should be written");
    let path_str = path.to_str().expect("path is utf-8");
    let registry = FileWatchRegistry::new();
    let events = start_collecting(&registry, path_str);

    fs::write(&path, "data 注文 = int\n").expect("file should be updated");

    assert_eq!(
        recv_event(&events),
        FileWatchEvent::Changed {
            path: path_str.to_string(),
        }
    );
}

#[test]
fn 連続した変更はデバウンスされて1件の変更イベントになる() {
    let workspace = TempWorkspace::create();
    let path = workspace.path("note.dmodel");
    fs::write(&path, "v1\n").expect("fixture should be written");
    let path_str = path.to_str().expect("path is utf-8");
    let registry = FileWatchRegistry::new();
    let events = start_collecting(&registry, path_str);

    fs::write(&path, "v2\n").expect("first write should succeed");
    thread::sleep(Duration::from_millis(40));
    fs::write(&path, "v3\n").expect("second write should succeed");
    thread::sleep(Duration::from_millis(40));
    fs::write(&path, "v4\n").expect("third write should succeed");

    assert_eq!(
        recv_event(&events),
        FileWatchEvent::Changed {
            path: path_str.to_string(),
        }
    );
    assert_no_event(&events);
}

#[test]
fn ファイルを削除すると削除イベントが返る() {
    let workspace = TempWorkspace::create();
    let path = workspace.path("note.dmodel");
    fs::write(&path, "data 注文 = string\n").expect("fixture should be written");
    let path_str = path.to_str().expect("path is utf-8");
    let registry = FileWatchRegistry::new();
    let events = start_collecting(&registry, path_str);

    fs::remove_file(&path).expect("file should be removed");

    assert_eq!(
        recv_event(&events),
        FileWatchEvent::Deleted {
            path: path_str.to_string(),
        }
    );
}

#[test]
fn 削除の直後に再作成すると変更イベントになる() {
    let workspace = TempWorkspace::create();
    let path = workspace.path("note.dmodel");
    fs::write(&path, "old\n").expect("fixture should be written");
    let path_str = path.to_str().expect("path is utf-8");
    let registry = FileWatchRegistry::new();
    let events = start_collecting(&registry, path_str);

    fs::remove_file(&path).expect("file should be removed");
    fs::write(&path, "new\n").expect("file should reappear");

    assert_eq!(
        recv_event(&events),
        FileWatchEvent::Changed {
            path: path_str.to_string(),
        }
    );
    assert_no_event(&events);
}

#[test]
fn 削除イベントの後に再出現すると変更イベントが返る() {
    let workspace = TempWorkspace::create();
    let path = workspace.path("note.dmodel");
    fs::write(&path, "old\n").expect("fixture should be written");
    let path_str = path.to_str().expect("path is utf-8");
    let registry = FileWatchRegistry::new();
    let events = start_collecting(&registry, path_str);

    fs::remove_file(&path).expect("file should be removed");
    assert_eq!(
        recv_event(&events),
        FileWatchEvent::Deleted {
            path: path_str.to_string(),
        }
    );

    fs::write(&path, "new\n").expect("file should reappear");
    assert_eq!(
        recv_event(&events),
        FileWatchEvent::Changed {
            path: path_str.to_string(),
        }
    );
}

#[test]
fn 存在しないファイルの監視を開始して作成すると変更イベントが返る() {
    let workspace = TempWorkspace::create();
    let path = workspace.path("missing.dmodel");
    let path_str = path.to_str().expect("path is utf-8");
    let registry = FileWatchRegistry::new();
    let events = start_collecting(&registry, path_str);

    fs::write(&path, "data 注文 = string\n").expect("file should be created");

    assert_eq!(
        recv_event(&events),
        FileWatchEvent::Changed {
            path: path_str.to_string(),
        }
    );
}

#[test]
fn 監視を止めたあとの変更はイベントにならない() {
    let workspace = TempWorkspace::create();
    let path = workspace.path("note.dmodel");
    fs::write(&path, "v1\n").expect("fixture should be written");
    let path_str = path.to_str().expect("path is utf-8");
    let registry = FileWatchRegistry::new();
    let events = start_collecting(&registry, path_str);

    assert_eq!(registry.stop(path_str), FileWatchResult::Ok);
    fs::write(&path, "v2\n").expect("file should be updated after stop");

    assert_no_event(&events);
}

#[test]
fn 同じパスの監視開始は追加のイベントを生まない() {
    let workspace = TempWorkspace::create();
    let path = workspace.path("note.dmodel");
    fs::write(&path, "v1\n").expect("fixture should be written");
    let path_str = path.to_str().expect("path is utf-8");
    let registry = FileWatchRegistry::new();
    let events = start_collecting(&registry, path_str);

    assert_eq!(
        registry.start(path_str, |_| panic!("duplicate watch should not emit")),
        FileWatchResult::Ok
    );

    fs::write(&path, "v2\n").expect("file should be updated");

    assert_eq!(
        recv_event(&events),
        FileWatchEvent::Changed {
            path: path_str.to_string(),
        }
    );
    assert_no_event(&events);
}

#[test]
fn 監視していないパスの停止は成功として返る() {
    let registry = FileWatchRegistry::new();

    assert_eq!(
        registry.stop("/tmp/not-watched.dmodel"),
        FileWatchResult::Ok
    );
}

#[test]
fn 親ディレクトリが無いと監視失敗が値として返る() {
    let workspace = TempWorkspace::create();
    let path = workspace.path("missing-dir").join("note.dmodel");
    let path_str = path.to_str().expect("path is utf-8");
    let registry = FileWatchRegistry::new();

    let json =
        serde_json::to_value(registry.start(path_str, |_| {})).expect("result should serialize");

    assert_eq!(json["type"], "err");
    assert_eq!(json["error"]["kind"], "watchFailed");
    assert_eq!(json["error"]["path"], path_str);
    assert_ne!(json["error"]["message"], "");
}

#[test]
fn ファイル名の無いパスは監視失敗が値として返る() {
    let registry = FileWatchRegistry::new();

    let json = serde_json::to_value(registry.start("/", |_| {})).expect("result should serialize");

    assert_eq!(json["type"], "err");
    assert_eq!(json["error"]["kind"], "watchFailed");
    assert_eq!(json["error"]["path"], "/");
    assert_ne!(json["error"]["message"], "");
}

fn start_collecting(registry: &FileWatchRegistry, path: &str) -> Receiver<FileWatchEvent> {
    let (tx, rx) = mpsc::channel();
    let result = registry.start(path, move |event| {
        let _ = tx.send(event);
    });
    assert_eq!(result, FileWatchResult::Ok);
    thread::sleep(Duration::from_millis(120));
    rx
}

fn recv_event(events: &Receiver<FileWatchEvent>) -> FileWatchEvent {
    events
        .recv_timeout(Duration::from_secs(3))
        .expect("watch event should arrive")
}

fn assert_no_event(events: &Receiver<FileWatchEvent>) {
    let extra = events.recv_timeout(DEBOUNCE + Duration::from_millis(200));
    assert!(extra.is_err(), "unexpected extra watch event: {extra:?}");
}
