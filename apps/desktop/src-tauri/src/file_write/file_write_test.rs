use std::fs;
use std::path::PathBuf;

use super::{write_utf8_file, FileWriteResult};
use crate::temp_workspace::TempWorkspace;

#[test]
fn 新規ファイルへ書くと内容が残る() {
    let workspace = TempWorkspace::create();
    let path = workspace.path("note.dmodel");
    let path_str = path.to_str().expect("path is utf-8");

    let result = write_utf8_file(path_str, "data 注文 = string\n");

    assert_eq!(result, FileWriteResult::Ok);
    assert_eq!(
        fs::read_to_string(&path).expect("written file should be readable"),
        "data 注文 = string\n"
    );
}

#[test]
fn 正常に書き込むと一時ファイルを残さない() {
    let workspace = TempWorkspace::create();
    let path = workspace.path("note.dmodel");
    let path_str = path.to_str().expect("path is utf-8");

    write_utf8_file(path_str, "data 注文 = string\n");

    assert_eq!(workspace.entry_names(), ["note.dmodel"]);
}

#[test]
fn 既存ファイルを上書きすると新しい内容になる() {
    let workspace = TempWorkspace::create();
    let path = workspace.path("board.dcanvas");
    fs::write(&path, "old contents\n").expect("fixture should be written");
    let path_str = path.to_str().expect("path is utf-8");

    let result = write_utf8_file(path_str, "new contents\n");

    assert_eq!(result, FileWriteResult::Ok);
    assert_eq!(
        fs::read_to_string(&path).expect("written file should be readable"),
        "new contents\n"
    );
}

#[test]
fn 空文字を書くと空ファイルになる() {
    let workspace = TempWorkspace::create();
    let path = workspace.path("empty.dmodel");
    fs::write(&path, "not empty").expect("fixture should be written");
    let path_str = path.to_str().expect("path is utf-8");

    let result = write_utf8_file(path_str, "");

    assert_eq!(result, FileWriteResult::Ok);
    assert_eq!(
        fs::read_to_string(&path).expect("written file should be readable"),
        ""
    );
}

#[test]
fn 親ディレクトリが無いと書き込み失敗が値として返る() {
    let workspace = TempWorkspace::create();
    let path = workspace.path("missing-dir").join("note.dmodel");
    let path_str = path.to_str().expect("path is utf-8");

    let json = serde_json::to_value(write_utf8_file(path_str, "data 注文 = string\n"))
        .expect("result should serialize");

    assert_eq!(json["type"], "err");
    assert_eq!(json["error"]["kind"], "writeFailed");
    assert_eq!(json["error"]["path"], path_str);
    assert_ne!(json["error"]["message"], "");
    assert!(!path.exists());
}

#[test]
fn ディレクトリへ書くと書き込み失敗が値として返る() {
    let workspace = TempWorkspace::create();
    let path = workspace.path("note.dmodel");
    fs::create_dir(&path).expect("target directory should be created");
    let path_str = path.to_str().expect("path is utf-8");

    let json =
        serde_json::to_value(write_utf8_file(path_str, "nope\n")).expect("result should serialize");

    assert_eq!(json["type"], "err");
    assert_eq!(json["error"]["kind"], "writeFailed");
    assert_eq!(json["error"]["path"], path_str);
    assert_ne!(json["error"]["message"], "");
    assert!(path.is_dir());
}

#[test]
fn ディレクトリへの書き込み失敗後に一時ファイルを残さない() {
    let workspace = TempWorkspace::create();
    let path = workspace.path("note.dmodel");
    fs::create_dir(&path).expect("target directory should be created");
    let path_str = path.to_str().expect("path is utf-8");

    let result = write_utf8_file(path_str, "nope\n");

    assert!(matches!(result, FileWriteResult::Err { .. }));
    assert!(path.is_dir());
    assert_eq!(workspace.entry_names(), ["note.dmodel"]);
}

#[test]
fn 書き込み失敗はjsonの値としてシリアライズされる() {
    let result = write_utf8_file("/no/such/domain-modeler-dir/note.dmodel", "x");

    let json = serde_json::to_value(&result).expect("result should serialize");

    assert_eq!(json["type"], "err");
    assert_eq!(json["error"]["kind"], "writeFailed");
    assert_eq!(
        json["error"]["path"],
        "/no/such/domain-modeler-dir/note.dmodel"
    );
    assert_ne!(json["error"]["message"], "");
}

#[cfg(unix)]
struct RestoredPermissions {
    path: PathBuf,
    permissions: fs::Permissions,
}

#[cfg(unix)]
impl Drop for RestoredPermissions {
    fn drop(&mut self) {
        let _ = fs::set_permissions(&self.path, self.permissions.clone());
    }
}

#[cfg(unix)]
#[test]
fn 書き込みに失敗しても既存ファイルの内容は残る() {
    use std::os::unix::fs::PermissionsExt;

    let workspace = TempWorkspace::create();
    let path = workspace.path("note.dmodel");
    fs::write(&path, "original\n").expect("fixture should be written");
    let path_str = path.to_str().expect("path is utf-8");

    let original_permissions = fs::metadata(workspace.dir())
        .expect("workspace metadata should be readable")
        .permissions();
    let _restore = RestoredPermissions {
        path: workspace.dir().to_path_buf(),
        permissions: original_permissions.clone(),
    };
    let mut readonly = original_permissions;
    readonly.set_mode(0o555);
    fs::set_permissions(workspace.dir(), readonly).expect("workspace should become read-only");

    let result = write_utf8_file(path_str, "new content\n");

    assert!(matches!(result, FileWriteResult::Err { .. }));
    assert_eq!(
        fs::read_to_string(&path).expect("existing file should remain readable"),
        "original\n"
    );
}
