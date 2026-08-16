use std::path::PathBuf;

use tauri_plugin_dialog::FilePath;

use super::{open_dialog_filters, open_dialog_result, save_dialog_result, DocumentKind};

#[test]
fn 開くダイアログのフィルタはdcanvasとdmodelを含む() {
    let filters = open_dialog_filters();

    assert_eq!(filters.len(), 1);
    assert_eq!(filters[0].extensions, &["dcanvas", "dmodel"]);
}

#[test]
fn キャンバスの保存フィルタはdcanvasのみ() {
    let filter = DocumentKind::Canvas.dialog_filter();

    assert_eq!(filter.extensions, &["dcanvas"]);
}

#[test]
fn ドメインモデルの保存フィルタはdmodelのみ() {
    let filter = DocumentKind::Model.dialog_filter();

    assert_eq!(filter.extensions, &["dmodel"]);
}

#[test]
fn 開くダイアログをキャンセルするとnullになる() {
    let json = serde_json::to_value(open_dialog_result(None)).expect("result should serialize");

    assert_eq!(json, serde_json::Value::Null);
}

#[test]
fn 開くダイアログで選択するとpathが返る() {
    let path = FilePath::from(PathBuf::from("/tmp/board.dcanvas"));

    let result = open_dialog_result(Some(path));

    assert_eq!(result, Some("/tmp/board.dcanvas".to_string()));
}

#[test]
fn 保存ダイアログをキャンセルするとnullになる() {
    let json = serde_json::to_value(save_dialog_result(None, DocumentKind::Canvas))
        .expect("result should serialize");

    assert_eq!(json, serde_json::Value::Null);
}

#[test]
fn 保存ダイアログで選択するとpathが返る() {
    let path = FilePath::from(PathBuf::from("/tmp/board.dcanvas"));

    let result = save_dialog_result(Some(path), DocumentKind::Canvas);

    assert_eq!(result, Some("/tmp/board.dcanvas".to_string()));
}

#[test]
fn 保存ダイアログで拡張子が無いと文書種別の拡張子を付ける() {
    let path = FilePath::from(PathBuf::from("/tmp/board"));

    let result = save_dialog_result(Some(path), DocumentKind::Canvas);

    assert_eq!(result, Some("/tmp/board.dcanvas".to_string()));
}

#[test]
fn 保存ダイアログで別の拡張子だと文書種別の拡張子に揃える() {
    let path = FilePath::from(PathBuf::from("/tmp/note.txt"));

    let result = save_dialog_result(Some(path), DocumentKind::Model);

    assert_eq!(result, Some("/tmp/note.dmodel".to_string()));
}

#[test]
fn 文書種別はjsonでキャメルケースの語彙になる() {
    let canvas = serde_json::to_value(DocumentKind::Canvas).expect("kind should serialize");
    let model = serde_json::to_value(DocumentKind::Model).expect("kind should serialize");

    assert_eq!(canvas, "canvas");
    assert_eq!(model, "model");
}
