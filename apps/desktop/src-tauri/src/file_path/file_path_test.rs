use std::fs;

use crate::temp_workspace::TempWorkspace;

#[test]
fn 相対表現が異なる同じファイルを一致と判定する() {
    let workspace = TempWorkspace::create();
    let path = workspace.path("draft.dmodel");
    fs::write(&path, "draft").unwrap();
    let with_parent = path.parent().unwrap().join(".").join("draft.dmodel");

    assert!(super::same_file_path(
        path.to_str().unwrap(),
        with_parent.to_str().unwrap()
    ));
}

#[cfg(any(target_os = "windows", target_os = "macos"))]
#[test]
fn 削除済みパスの大文字小文字違いを一致と判定する() {
    let workspace = TempWorkspace::create();
    let upper = workspace.path("Draft.dmodel");
    let lower = workspace.path("draft.dmodel");

    assert!(super::same_file_path(
        upper.to_str().unwrap(),
        lower.to_str().unwrap()
    ));
}
