use std::fs;
use std::path::{Path, PathBuf};

use serde::{Deserialize, Serialize};

use crate::file_read::{read_utf8_file, FileReadResult};
use crate::file_write::{write_utf8_file, FileWriteError, FileWriteResult};

/// 外観テーマ。
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub enum Theme {
    /// 明るい外観。
    Light,
    /// 暗い外観。
    Dark,
    /// OS の外観に合わせる。
    #[default]
    System,
}

/// 前回終了時に開いていたタブ群とアクティブタブ。
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct TabsSettings {
    /// 開いていた文書のパス。
    #[serde(default)]
    pub open_paths: Vec<String>,
    /// アクティブタブのパス。タブが無いときは `None`。
    #[serde(default)]
    pub active_path: Option<String>,
}

/// ウィンドウの位置とサイズ。
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WindowBounds {
    /// 画面左上からの X 座標。
    pub x: i32,
    /// 画面左上からの Y 座標。
    pub y: i32,
    /// ウィンドウ幅。
    pub width: u32,
    /// ウィンドウ高さ。
    pub height: u32,
}

/// アプリ設定。文書ファイルには含めず、OS 標準の設定ディレクトリへ保存する。
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct AppSettings {
    /// 開いていたタブ群とアクティブタブ。
    #[serde(default)]
    pub tabs: TabsSettings,
    /// 保存済みのウィンドウ位置・サイズ。未保存なら `None`。
    #[serde(default)]
    pub window: Option<WindowBounds>,
    /// テーマ設定。
    #[serde(default)]
    pub theme: Theme,
}

impl AppSettings {
    /// 設定ファイル名。OS 標準のアプリ設定ディレクトリ直下に置く。
    pub const FILE_NAME: &'static str = "settings.json";

    /// 設定ディレクトリ内の設定ファイルパス。
    ///
    /// # Arguments
    ///
    /// * `config_dir` - OS 標準のアプリ設定ディレクトリ。
    pub fn path_in(config_dir: &Path) -> PathBuf {
        config_dir.join(Self::FILE_NAME)
    }

    /// JSON 文字列から設定を作る。壊れていれば既定値にする。
    ///
    /// # Arguments
    ///
    /// * `text` - 設定ファイルの内容。
    pub fn from_json_or_default(text: &str) -> Self {
        serde_json::from_str(text).unwrap_or_default()
    }

    /// 設定ディレクトリから設定を読む。
    ///
    /// ファイルが無い・読めない・壊れている場合は既定値を返す。
    ///
    /// # Arguments
    ///
    /// * `config_dir` - OS 標準のアプリ設定ディレクトリ。
    pub fn read_from_config_dir(config_dir: &Path) -> Self {
        let path = Self::path_in(config_dir);
        let Some(path_str) = path.to_str() else {
            return Self::default();
        };
        match read_utf8_file(path_str) {
            FileReadResult::Ok { value } => Self::from_json_or_default(&value),
            FileReadResult::Err { .. } => Self::default(),
        }
    }

    /// 設定ディレクトリへ設定をアトミックに書く。
    ///
    /// ディレクトリが無ければ作成する。失敗は panic せず値として返す。
    ///
    /// # Arguments
    ///
    /// * `config_dir` - OS 標準のアプリ設定ディレクトリ。
    pub fn write_to_config_dir(&self, config_dir: &Path) -> AppSettingsWriteResult {
        let path = Self::path_in(config_dir);
        let Some(path_str) = path.to_str() else {
            return AppSettingsWriteResult::write_failed(
                &path.to_string_lossy(),
                "path is not valid utf-8",
            );
        };
        if let Err(err) = fs::create_dir_all(config_dir) {
            return AppSettingsWriteResult::write_failed(path_str, &err.to_string());
        }
        let json = match serde_json::to_string_pretty(self) {
            Ok(json) => json,
            Err(err) => return AppSettingsWriteResult::write_failed(path_str, &err.to_string()),
        };
        match write_utf8_file(path_str, &json) {
            FileWriteResult::Ok => AppSettingsWriteResult::Ok,
            FileWriteResult::Err {
                error: FileWriteError::WriteFailed { path, message },
            } => AppSettingsWriteResult::write_failed(&path, &message),
        }
    }
}

/// アプリ設定書き込みの失敗理由。
///
/// IPC では例外にせず、この値を結果として返す。
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(tag = "kind", rename_all = "camelCase")]
pub enum AppSettingsWriteError {
    /// アプリ設定ディレクトリを解決できなかった。
    ConfigDirUnavailable {
        /// 失敗理由。
        message: String,
    },
    /// 書き込みに失敗した(権限不足・ディレクトリ作成失敗など)。
    WriteFailed {
        /// 書き込み対象のパス。
        path: String,
        /// OS が返す失敗理由。
        message: String,
    },
}

/// アプリ設定書き込みの結果。成功も失敗も値として返す。
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "camelCase")]
pub enum AppSettingsWriteResult {
    /// 設定を書き込めた。
    Ok,
    /// 書き込みに失敗した。
    Err {
        /// 失敗理由。
        error: AppSettingsWriteError,
    },
}

impl AppSettingsWriteResult {
    /// 設定ディレクトリを解決できなかったときの失敗。
    ///
    /// # Arguments
    ///
    /// * `message` - 失敗理由。
    pub fn config_dir_unavailable(message: &str) -> Self {
        Self::Err {
            error: AppSettingsWriteError::ConfigDirUnavailable {
                message: message.to_string(),
            },
        }
    }

    fn write_failed(path: &str, message: &str) -> Self {
        Self::Err {
            error: AppSettingsWriteError::WriteFailed {
                path: path.to_string(),
                message: message.to_string(),
            },
        }
    }
}

#[cfg(test)]
mod app_settings_test;
