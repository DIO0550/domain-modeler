use std::fs;
use std::path::PathBuf;

use super::{AppSettings, AppSettingsWriteResult, TabsSettings, Theme, WindowBounds};
use crate::temp_workspace::TempWorkspace;

#[cfg(unix)]
use crate::temp_workspace::RestoredPermissions;

fn sample_settings() -> AppSettings {
    AppSettings {
        tabs: TabsSettings {
            open_paths: vec![
                "/tmp/board.dcanvas".to_string(),
                "/tmp/note.dmodel".to_string(),
            ],
            active_path: Some("/tmp/note.dmodel".to_string()),
        },
        window: Some(WindowBounds {
            x: 24,
            y: 48,
            width: 1280,
            height: 800,
        }),
        theme: Theme::Dark,
    }
}

#[test]
fn 設定ファイルが無いと既定値が返る() {
    let workspace = TempWorkspace::create();

    let settings = AppSettings::read_from_config_dir(workspace.dir());

    assert_eq!(settings, AppSettings::default());
}

#[test]
fn 既定値は空のタブと未保存ウィンドウとsystemテーマである() {
    let settings = AppSettings::default();

    assert_eq!(settings.tabs.open_paths, Vec::<String>::new());
    assert_eq!(settings.tabs.active_path, None);
    assert_eq!(settings.window, None);
    assert_eq!(settings.theme, Theme::System);
}

#[test]
fn 壊れたjsonでも既定値が返る() {
    let workspace = TempWorkspace::create();
    fs::write(AppSettings::path_in(workspace.dir()), "{ not json")
        .expect("fixture should be written");

    let settings = AppSettings::read_from_config_dir(workspace.dir());

    assert_eq!(settings, AppSettings::default());
}

#[test]
fn 空の設定ファイルでも既定値が返る() {
    let workspace = TempWorkspace::create();
    fs::write(AppSettings::path_in(workspace.dir()), "").expect("fixture should be written");

    let settings = AppSettings::read_from_config_dir(workspace.dir());

    assert_eq!(settings, AppSettings::default());
}

#[test]
fn utf8でない設定ファイルでも既定値が返る() {
    let workspace = TempWorkspace::create();
    fs::write(AppSettings::path_in(workspace.dir()), [0xff, 0xfe, 0xfd])
        .expect("fixture should be written");

    let settings = AppSettings::read_from_config_dir(workspace.dir());

    assert_eq!(settings, AppSettings::default());
}

#[test]
fn json配列の設定ファイルでも既定値が返る() {
    let workspace = TempWorkspace::create();
    fs::write(AppSettings::path_in(workspace.dir()), "[]").expect("fixture should be written");

    let settings = AppSettings::read_from_config_dir(workspace.dir());

    assert_eq!(settings, AppSettings::default());
}

#[test]
fn 未知のテーマ値でも既定値が返る() {
    let settings = AppSettings::from_json_or_default(r#"{"theme":"rainbow"}"#);

    assert_eq!(settings, AppSettings::default());
}

#[test]
fn 欠けたフィールドは既定値で補われる() {
    let json = r#"{"theme":"dark"}"#;

    let settings = AppSettings::from_json_or_default(json);

    assert_eq!(settings.theme, Theme::Dark);
    assert_eq!(settings.tabs, TabsSettings::default());
    assert_eq!(settings.window, None);
}

#[test]
fn 未知のフィールドがあっても残りの設定は読める() {
    let json = r#"{"theme":"light","unknown":true}"#;

    let settings = AppSettings::from_json_or_default(json);

    assert_eq!(settings.theme, Theme::Light);
}

#[test]
fn 設定を書くとsettings_jsonに残る() {
    let workspace = TempWorkspace::create();
    let settings = sample_settings();

    let result = settings.write_to_config_dir(workspace.dir());

    assert_eq!(result, AppSettingsWriteResult::Ok);
    assert_eq!(workspace.entry_names(), [AppSettings::FILE_NAME]);
}

#[test]
fn 書いた設定を読むと内容が一致する() {
    let workspace = TempWorkspace::create();
    let settings = sample_settings();

    settings.write_to_config_dir(workspace.dir());
    let loaded = AppSettings::read_from_config_dir(workspace.dir());

    assert_eq!(loaded, settings);
}

#[test]
fn 設定ファイルのパスは設定ディレクトリ直下のsettings_jsonである() {
    let path = AppSettings::path_in(std::path::Path::new("/tmp/domain-modeler-config"));

    assert_eq!(
        path,
        PathBuf::from("/tmp/domain-modeler-config/settings.json")
    );
}

#[test]
fn 設定ディレクトリが無くても書いて作成される() {
    let workspace = TempWorkspace::create();
    let config_dir = workspace.path("nested-config");
    let settings = sample_settings();

    let result = settings.write_to_config_dir(&config_dir);

    assert_eq!(result, AppSettingsWriteResult::Ok);
    assert_eq!(AppSettings::read_from_config_dir(&config_dir), settings);
}

#[test]
fn シリアライズはキャメルケースのjsonになる() {
    let json = serde_json::to_value(sample_settings()).expect("settings should serialize");

    assert_eq!(json["tabs"]["openPaths"][0], "/tmp/board.dcanvas");
    assert_eq!(json["tabs"]["activePath"], "/tmp/note.dmodel");
    assert_eq!(json["window"]["width"], 1280);
    assert_eq!(json["theme"], "dark");
}

#[test]
fn 書き込み失敗はjsonの値としてシリアライズされる() {
    let workspace = TempWorkspace::create();
    let blocking_file = workspace.path("not-a-dir");
    fs::write(&blocking_file, "file").expect("fixture should be written");
    let settings = sample_settings();

    let json = serde_json::to_value(settings.write_to_config_dir(&blocking_file))
        .expect("result should serialize");

    assert_eq!(json["type"], "err");
    assert_eq!(json["error"]["kind"], "writeFailed");
    assert_ne!(json["error"]["path"], "");
    assert_ne!(json["error"]["message"], "");
}

#[test]
fn 設定ディレクトリを解決できない失敗はjsonの値としてシリアライズされる() {
    let json = serde_json::to_value(AppSettingsWriteResult::config_dir_unavailable(
        "app config directory is unavailable",
    ))
    .expect("result should serialize");

    assert_eq!(json["type"], "err");
    assert_eq!(json["error"]["kind"], "configDirUnavailable");
    assert_eq!(
        json["error"]["message"],
        "app config directory is unavailable"
    );
}

#[cfg(unix)]
#[test]
fn 書き込みに失敗しても既存の設定ファイルは残る() {
    let workspace = TempWorkspace::create();
    let settings = sample_settings();
    settings.write_to_config_dir(workspace.dir());
    let original = fs::read_to_string(AppSettings::path_in(workspace.dir()))
        .expect("written settings should be readable");

    let _restore = RestoredPermissions::make_dir_readonly(workspace.dir());

    let result = AppSettings {
        theme: Theme::Light,
        ..settings
    }
    .write_to_config_dir(workspace.dir());

    assert!(matches!(result, AppSettingsWriteResult::Err { .. }));
    assert_eq!(
        fs::read_to_string(AppSettings::path_in(workspace.dir()))
            .expect("existing settings should remain readable"),
        original
    );
}
