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
    assert!(workspace
        .entry_names()
        .iter()
        .all(|name| name.starts_with(".dm-probe-")));
}

#[test]
fn 削除済みパスのunicode正規化は対象ディレクトリの規則で判定する() {
    let workspace = TempWorkspace::create();
    let composed = workspace.path("é.dmodel");
    let decomposed = workspace.path("e\u{301}.dmodel");
    fs::write(&composed, "probe").unwrap();
    let normalizes_unicode = decomposed.exists();
    fs::remove_file(&composed).unwrap();

    assert_eq!(
        super::same_file_path(
            composed.to_str().unwrap(),
            decomposed.to_str().unwrap()
        ),
        normalizes_unicode
    );
    assert!(workspace
        .entry_names()
        .iter()
        .all(|name| name.starts_with(".dm-probe-")));
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

#[cfg(unix)]
#[test]
fn 循環するシンボリックリンクは判定不能なので安全側で一致とみなす() {
    let workspace = TempWorkspace::create();
    let first = workspace.path("first.dmodel");
    let second = workspace.path("second.dmodel");
    let target = workspace.path("target.dmodel");
    std::os::unix::fs::symlink(&second, &first).unwrap();
    std::os::unix::fs::symlink(&first, &second).unwrap();

    assert!(super::same_file_path(
        first.to_str().unwrap(),
        target.to_str().unwrap()
    ));
}

#[test]
fn 長いファイル名の規則確認用コンポーネントは上限のある長さになる() {
    use std::ffi::OsStr;

    let left = format!("{}A{}", "前".repeat(120), "後".repeat(120));
    let right = format!("{}a{}", "前".repeat(120), "後".repeat(120));
    let (left_probe, right_probe) =
        super::compact_probe_names(OsStr::new(&left), OsStr::new(&right));

    assert!(left_probe.len() <= 164);
    assert!(right_probe.len() <= 164);
    assert_ne!(left_probe, right_probe);
}

#[cfg(unix)]
#[test]
fn 規則確認用コンポーネントは非utf8の生バイトを保持する() {
    use std::ffi::{OsStr, OsString};
    use std::os::unix::ffi::{OsStrExt, OsStringExt};

    let raw = OsString::from_vec(b"draft-\xff.dmodel".to_vec());
    let replacement = OsStr::new("draft-�.dmodel");
    let (raw_probe, replacement_probe) =
        super::compact_probe_names(&raw, replacement);

    assert_ne!(raw_probe, replacement_probe);
    assert!(raw_probe.as_bytes().contains(&0xff));
}

#[cfg(unix)]
#[test]
fn 同時刻でも規則確認用プローブ名はatomic_nonceで重複しない() {
    use std::ffi::OsStr;

    let workspace = TempWorkspace::create();
    assert_eq!(
        super::file_names_are_equivalent(
            workspace.dir(),
            OsStr::new("first.dmodel"),
            OsStr::new("second.dmodel"),
        ),
        Some(false),
    );
    assert_eq!(
        super::file_names_are_equivalent(
            workspace.dir(),
            OsStr::new("first.dmodel"),
            OsStr::new("second.dmodel"),
        ),
        Some(false),
    );

    let entries = workspace.entry_names();
    assert_eq!(entries.len(), 4);
    assert_eq!(entries.iter().collect::<std::collections::HashSet<_>>().len(), 4);
}
