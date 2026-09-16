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

#[cfg(unix)]
#[test]
fn 長い結合文字列はファイルシステムが扱える場合だけ異なる基底文字を区別する() {
    let workspace = TempWorkspace::create();
    let marks = "\u{301}".repeat(70);
    let left = workspace.path(&format!("a{marks}.dmodel"));
    let right = workspace.path(&format!("b{marks}.dmodel"));

    // 結合文字の連続数に制約があるファイルシステムでは、バイト長以内でも
    // この名前は利用できない。実際の作成・参照可否でテストの前提を確認する。
    let left_result = fs::write(&left, "left");
    let right_result = fs::write(&right, "right");
    let supported = left_result.is_ok() && right_result.is_ok();
    if left_result.is_ok() {
        fs::remove_file(&left).unwrap();
    }
    if right_result.is_ok() {
        fs::remove_file(&right).unwrap();
    }
    assert_eq!(
        super::same_file_path(left.to_str().unwrap(), right.to_str().unwrap()),
        !supported,
        "filesystem name support: left={left_result:?}, right={right_result:?}",
    );
}

#[cfg(unix)]
#[test]
fn 利用可能な結合文字列では異なる基底文字を区別する() {
    let workspace = TempWorkspace::create();
    let marks = "\u{301}".repeat(16);
    let left = workspace.path(&format!("a{marks}.dmodel"));
    let right = workspace.path(&format!("b{marks}.dmodel"));
    fs::write(&left, "left").unwrap();
    fs::write(&right, "right").unwrap();
    fs::remove_file(&left).unwrap();
    fs::remove_file(&right).unwrap();
    assert!(!super::same_file_path(left.to_str().unwrap(), right.to_str().unwrap()));
}

#[cfg(unix)]
#[test]
fn 長いhangulの合成形と分解形は対象ディレクトリの規則で判定する() {
    let workspace = TempWorkspace::create();
    let composed = workspace.path(&format!("{}.dmodel", "가".repeat(35)));
    let decomposed = workspace.path(&format!(
        "{}.dmodel",
        "\u{1100}\u{1161}".repeat(35),
    ));
    fs::write(&composed, "probe").unwrap();
    let normalizes_unicode = decomposed.exists();
    fs::remove_file(&composed).unwrap();

    assert_eq!(
        super::same_file_path(
            composed.to_str().unwrap(),
            decomposed.to_str().unwrap(),
        ),
        normalizes_unicode,
    );
}

#[test]
fn 既存の左プローブ名と衝突したら別prefixで再確保する結果を返す() {
    let workspace = TempWorkspace::create();
    let left = workspace.path("left-probe");
    let right = workspace.path("right-probe");
    fs::write(&left, "stale").unwrap();

    assert_eq!(
        super::probe_file_names(&left, &right),
        super::ProbeResult::RetryAllocation,
    );
    assert!(!right.exists());
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
    assert_eq!(
        entries
            .iter()
            .collect::<std::collections::HashSet<_>>()
            .len(),
        entries.len(),
    );
    assert!(entries.len() >= 2);
    assert!(entries.iter().all(|name| name.starts_with(".dm-probe-")));
    assert!(entries
        .iter()
        .all(|name| workspace.path(name).is_file()));
}
