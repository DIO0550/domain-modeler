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

#[test]
fn 削除済みパスの大文字小文字は対象ディレクトリの規則で判定する() {
    let workspace = TempWorkspace::create();
    let upper = workspace.path("Draft.dmodel");
    let lower = workspace.path("draft.dmodel");
    let probe_upper = workspace.path("CaseProbe");
    let probe_lower = workspace.path("caseprobe");
    fs::write(&probe_upper, "probe").unwrap();
    let is_case_sensitive = !probe_lower.exists();
    fs::remove_file(probe_upper).unwrap();

    assert_eq!(
        super::same_file_path(upper.to_str().unwrap(), lower.to_str().unwrap()),
        !is_case_sensitive
    );
    assert!(workspace.entry_names().is_empty());
}

#[cfg(unix)]
#[test]
fn 削除済みファイルもシンボリックリンク先の親を解決して一致と判定する() {
    let workspace = TempWorkspace::create();
    let real = workspace.path("real");
    let alias = workspace.path("alias");
    fs::create_dir(&real).unwrap();
    std::os::unix::fs::symlink(&real, &alias).unwrap();

    assert!(super::same_file_path(
        alias.join("draft.dmodel").to_str().unwrap(),
        real.join("draft.dmodel").to_str().unwrap()
    ));
}

#[cfg(unix)]
#[test]
fn 親参照より先にシンボリックリンクを解決して削除済みファイルを判定する() {
    let workspace = TempWorkspace::create();
    let alias_parent = workspace.path("alias-parent");
    let real_parent = workspace.path("real-parent");
    let linked_directory = real_parent.join("linked-directory");
    fs::create_dir(&alias_parent).unwrap();
    fs::create_dir_all(&linked_directory).unwrap();
    std::os::unix::fs::symlink(&linked_directory, alias_parent.join("link"))
        .unwrap();

    let through_link = alias_parent.join("link").join("..").join("draft.dmodel");
    let actual = real_parent.join("draft.dmodel");

    assert!(super::same_file_path(
        through_link.to_str().unwrap(),
        actual.to_str().unwrap()
    ));
}

#[cfg(unix)]
#[test]
fn 削除済みファイルを指すシンボリックリンクも参照先と一致と判定する() {
    let workspace = TempWorkspace::create();
    let real_parent = workspace.path("real");
    let target = real_parent.join("draft.dmodel");
    let link = workspace.path("link.dmodel");
    fs::create_dir(&real_parent).unwrap();
    std::os::unix::fs::symlink(&target, &link).unwrap();

    assert!(super::same_file_path(
        link.to_str().unwrap(),
        target.to_str().unwrap()
    ));
}
