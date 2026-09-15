use std::fs;

use super::{write_utf8_file, FileWriteResult};
use crate::temp_workspace::TempWorkspace;

#[cfg(unix)]
use crate::temp_workspace::RestoredPermissions;

#[test]
fn 両文書を排他的に作成し競合先の内容を維持する() {
    for name in ["note.dmodel", "board.dcanvas"] {
        let workspace = TempWorkspace::create();
        let path = workspace.path(name);
        let path_str = path.to_str().unwrap();
        assert_eq!(super::create_utf8_file(path_str, "first"), FileWriteResult::Ok);
        assert!(matches!(super::create_utf8_file(path_str, "second"), FileWriteResult::Err { .. }));
        assert_eq!(fs::read_to_string(&path).unwrap(), "first");
        assert_eq!(workspace.entry_names(), [name]);
    }
}

#[cfg(unix)]
#[test]
fn 新規作成は壊れたシンボリックリンクも置換しない() {
    let workspace = TempWorkspace::create();
    let missing = workspace.path("missing.dcanvas");
    let link = workspace.path("link.dcanvas");
    std::os::unix::fs::symlink(&missing, &link).unwrap();
    assert!(matches!(super::create_utf8_file(link.to_str().unwrap(), "new"), FileWriteResult::Err { .. }));
    assert!(link.is_symlink());
    assert!(!missing.exists());
    assert_eq!(workspace.entry_names(), ["link.dcanvas"]);
}

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
#[test]
fn 書き込みに失敗しても既存ファイルの内容は残る() {
    let workspace = TempWorkspace::create();
    let path = workspace.path("note.dmodel");
    fs::write(&path, "original\n").expect("fixture should be written");
    let path_str = path.to_str().expect("path is utf-8");

    let _restore = RestoredPermissions::make_dir_readonly(workspace.dir());

    let result = write_utf8_file(path_str, "new content\n");

    assert!(matches!(result, FileWriteResult::Err { .. }));
    assert_eq!(
        fs::read_to_string(&path).expect("existing file should remain readable"),
        "original\n"
    );
}

#[test]
fn 生成モデルは新規作成され既存ファイルには追記も上書きもしない() {
    let workspace = TempWorkspace::create();
    let path = workspace.path("generated.dmodel");
    let path_str = path.to_str().unwrap();
    assert_eq!(super::create_dmodel_file(path_str, "first"), FileWriteResult::Ok);
    assert!(matches!(super::create_dmodel_file(path_str, "second"), FileWriteResult::Err { .. }));
    assert_eq!(fs::read_to_string(&path).unwrap(), "first");
    assert_eq!(workspace.entry_names(), ["generated.dmodel"]);
}

#[test]
fn 生成モデルはキャンバス拡張子に保存できない() {
    let workspace = TempWorkspace::create();
    let path = workspace.path("source.dcanvas");
    assert!(matches!(super::create_dmodel_file(path.to_str().unwrap(), "model"), FileWriteResult::Err { .. }));
    assert!(!path.exists());
}

#[cfg(unix)]
#[test]
fn 生成モデルはシンボリックリンク先も変更しない() {
    let workspace = TempWorkspace::create();
    let original = workspace.path("original.dmodel");
    let link = workspace.path("link.dmodel");
    fs::write(&original, "original").unwrap();
    std::os::unix::fs::symlink(&original, &link).unwrap();
    assert!(matches!(super::create_dmodel_file(link.to_str().unwrap(), "new"), FileWriteResult::Err { .. }));
    assert_eq!(fs::read_to_string(original).unwrap(), "original");
    assert!(link.is_symlink());
}
