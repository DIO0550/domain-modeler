use std::fs::{self, File};
use std::os::windows::fs::OpenOptionsExt;

use super::same_open_file;
use crate::temp_workspace::TempWorkspace;

#[test]
fn 同じファイルの別ハンドルは一致する() {
    let workspace = TempWorkspace::create();
    let path = workspace.path("note.dmodel");
    fs::write(&path, "same").unwrap();
    let left = File::open(&path).unwrap();
    let right = File::open(&path).unwrap();
    assert!(same_open_file(&left, &right).unwrap());
}

#[test]
fn 同じ内容でも別ファイルは一致しない() {
    let workspace = TempWorkspace::create();
    let left = workspace.path("left.dmodel");
    let right = workspace.path("right.dmodel");
    fs::write(&left, "same").unwrap();
    fs::write(&right, "same").unwrap();
    assert!(!same_open_file(&File::open(left).unwrap(), &File::open(right).unwrap()).unwrap());
}

#[test]
fn ハードリンク経由でも同じファイルは一致する() {
    let workspace = TempWorkspace::create();
    let original = workspace.path("original.dmodel");
    let alias = workspace.path("alias.dmodel");
    fs::write(&original, "same").unwrap();
    fs::hard_link(&original, &alias).unwrap();
    assert!(same_open_file(&File::open(original).unwrap(), &File::open(alias).unwrap()).unwrap());
}

#[test]
fn ディレクトリの同一性も判定できる() {
    let workspace = TempWorkspace::create();
    let other = workspace.path("other");
    fs::create_dir(&other).unwrap();
    const FILE_FLAG_BACKUP_SEMANTICS: u32 = 0x0200_0000;
    let open = |path| File::options().access_mode(0).custom_flags(FILE_FLAG_BACKUP_SEMANTICS).open(path).unwrap();
    let left = open(workspace.dir());
    assert!(same_open_file(&left, &open(workspace.dir())).unwrap());
    assert!(!same_open_file(&left, &open(&other)).unwrap());
}

#[test]
fn ファイル識別情報を持たないハンドルはエラーになる() {
    let device = File::open("NUL").unwrap();
    assert!(same_open_file(&device, &device).is_err());
}
