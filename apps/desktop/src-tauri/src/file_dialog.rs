use std::path::PathBuf;

use serde::{Deserialize, Serialize};
use tauri_plugin_dialog::FilePath;

/// 保存ダイアログで書き出す文書の種別。
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum DocumentKind {
    /// `.dcanvas` のキャンバス文書。
    Canvas,
    /// `.dmodel` のドメインモデル文書。
    Model,
}

impl DocumentKind {
    /// この種別のファイル拡張子(先頭のドットは含めない)。
    pub fn extension(self) -> &'static str {
        match self {
            Self::Canvas => "dcanvas",
            Self::Model => "dmodel",
        }
    }

    /// この種別向けの保存ダイアログフィルタ。
    pub fn dialog_filter(self) -> DialogFilter {
        match self {
            Self::Canvas => DialogFilter {
                name: "キャンバス",
                extensions: &["dcanvas"],
            },
            Self::Model => DialogFilter {
                name: "ドメインモデル",
                extensions: &["dmodel"],
            },
        }
    }
}

/// OS のファイルダイアログに渡す拡張子フィルタ。
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct DialogFilter {
    /// ダイアログに表示するフィルタ名。
    pub name: &'static str,
    /// ドットを含めない拡張子。
    pub extensions: &'static [&'static str],
}

/// 開くダイアログの `.dcanvas` / `.dmodel` フィルタ。
pub fn open_dialog_filters() -> &'static [DialogFilter] {
    &[DialogFilter {
        name: "キャンバス / ドメインモデル",
        extensions: &["dcanvas", "dmodel"],
    }]
}

/// ダイアログで選ばれたパスを IPC の戻り値にする。
///
/// キャンセル(`None`)はそのまま `null` になる。
pub fn open_dialog_result(picked: Option<FilePath>) -> Option<String> {
    picked.map(file_path_to_string)
}

/// 保存ダイアログで選ばれたパスを IPC の戻り値にする。
///
/// キャンセル(`None`)はそのまま `null` になる。
/// 選択時は文書種別の拡張子に揃える。
///
/// # Arguments
///
/// * `picked` - ダイアログの選択結果。
/// * `kind` - 保存する文書の種別。
pub fn save_dialog_result(picked: Option<FilePath>, kind: DocumentKind) -> Option<String> {
    picked.map(|path| with_document_extension(file_path_to_string(path), kind))
}

fn file_path_to_string(path: FilePath) -> String {
    let path = path.simplified();
    path.clone()
        .into_path()
        .map(|path| path.to_string_lossy().into_owned())
        .unwrap_or_else(|_| path.to_string())
}

fn with_document_extension(path: String, kind: DocumentKind) -> String {
    PathBuf::from(path)
        .with_extension(kind.extension())
        .to_string_lossy()
        .into_owned()
}

#[cfg(test)]
mod file_dialog_test;
