use std::env;
use std::fs;
use std::path::PathBuf;
use std::time::{SystemTime, UNIX_EPOCH};

use super::{read_utf8_file, FileReadError, FileReadResult};

struct TempWorkspace {
    dir: PathBuf,
}

impl TempWorkspace {
    fn create() -> Self {
        let nanos = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .expect("system clock is after unix epoch")
            .as_nanos();
        let dir = env::temp_dir().join(format!(
            "domain-modeler-read-file-{}-{}",
            std::process::id(),
            nanos
        ));
        fs::create_dir_all(&dir).expect("temp workspace should be created");
        Self { dir }
    }

    fn path(&self, name: &str) -> PathBuf {
        self.dir.join(name)
    }
}

impl Drop for TempWorkspace {
    fn drop(&mut self) {
        let _ = fs::remove_dir_all(&self.dir);
    }
}

#[test]
fn utf8ファイルを読むと内容の文字列が返る() {
    let workspace = TempWorkspace::create();
    let path = workspace.path("note.dmodel");
    fs::write(&path, "data 注文 = string\n").expect("fixture should be written");

    let result = read_utf8_file(path.to_str().expect("path is utf-8"));

    assert_eq!(
        result,
        FileReadResult::Ok {
            value: "data 注文 = string\n".to_string(),
        }
    );
}

#[test]
fn 空のutf8ファイルを読むと空文字が返る() {
    let workspace = TempWorkspace::create();
    let path = workspace.path("empty.dcanvas");
    fs::write(&path, "").expect("fixture should be written");

    let result = read_utf8_file(path.to_str().expect("path is utf-8"));

    assert_eq!(
        result,
        FileReadResult::Ok {
            value: String::new(),
        }
    );
}

#[test]
fn 存在しないファイルを読むと見つからないエラーが値として返る() {
    let workspace = TempWorkspace::create();
    let path = workspace.path("missing.dmodel");
    let path_str = path.to_str().expect("path is utf-8");

    let result = read_utf8_file(path_str);

    assert_eq!(
        result,
        FileReadResult::Err {
            error: FileReadError::NotFound {
                path: path_str.to_string(),
            },
        }
    );
}

#[test]
fn utf8でないバイト列のファイルを読むと不正なutf8エラーが値として返る() {
    let workspace = TempWorkspace::create();
    let path = workspace.path("binary.dmodel");
    fs::write(&path, [0xff, 0xfe, 0xfd]).expect("fixture should be written");
    let path_str = path.to_str().expect("path is utf-8");

    let result = read_utf8_file(path_str);

    assert_eq!(
        result,
        FileReadResult::Err {
            error: FileReadError::InvalidUtf8 {
                path: path_str.to_string(),
            },
        }
    );
}

#[test]
fn ディレクトリを読むと読み取り失敗が値として返る() {
    let workspace = TempWorkspace::create();
    let path_str = workspace.dir.to_str().expect("path is utf-8");

    let json = serde_json::to_value(read_utf8_file(path_str)).expect("result should serialize");

    assert_eq!(json["type"], "err");
    assert_eq!(json["error"]["kind"], "readFailed");
    assert_eq!(json["error"]["path"], path_str);
    assert_ne!(json["error"]["message"], "");
}

#[test]
fn 存在しないファイルの失敗はjsonの値としてシリアライズされる() {
    let result = read_utf8_file("/no/such/domain-modeler-file.dmodel");

    let json = serde_json::to_value(&result).expect("result should serialize");

    assert_eq!(json["type"], "err");
    assert_eq!(json["error"]["kind"], "notFound");
    assert_eq!(json["error"]["path"], "/no/such/domain-modeler-file.dmodel");
}
