# セットアップ / 開発コマンド

すべてリポジトリルートで実行します。React は `apps/desktop/`、Rust は `apps/desktop/src-tauri/` にあります。Tauri は初期化済みなので `pnpm tauri init` の再実行は不要です。

## 1. 開発環境と依存の準備

Dev Container は Node.js 24、pnpm、Rust stable、Linux用のネイティブ依存を含みます。[README の開始手順](README.md#開発を始める)でコンテナを開きます。

ホストで開発する場合も Node.js 24、`package.json` 指定の pnpm、Rust が必要です。ネイティブビルドにはOS別の開発ツールとシステムライブラリを用意してください（[Tauri公式の前提条件](https://v2.tauri.app/start/prerequisites/)）。ブラウザのUI開発とVitestにはRustは不要です。

```bash
node --version
pnpm --version
pnpm install --frozen-lockfile
```

workspace の依存はルートでまとめてインストールします。`apps/desktop` や各 package に個別インストールする必要はありません。

## 2. 起動

```bash
pnpm dev          # ブラウザでUIを確認: http://localhost:14000
pnpm storybook    # 個別コンポーネント: http://localhost:6006
```

ネイティブ機能を確認するときは、単独のViteを停止して以下を実行します。TauriがViteも起動します。

```bash
pnpm tauri dev
```

| 設定 | 値 | 設定ファイル |
| --- | --- | --- |
| フロントエンド出力 | `../dist`（apps/desktop/dist） | apps/desktop/src-tauri/tauri.conf.json |
| 開発URL | http://localhost:14000 | 同上 build.devUrl |
| 開発前コマンド | `pnpm --dir ../.. --filter @domain-modeler/desktop dev` | 同上 build.beforeDevCommand |
| ビルド前コマンド | `pnpm --dir ../.. --filter @domain-modeler/desktop build` | 同上 build.beforeBuildCommand |
| HMR | 14001 | apps/desktop/vite.config.ts |

### コンテナのGUI

- [noVNC](http://localhost:16080) またはVNCクライアントの `localhost:15901` から表示します。パスワードは `vscode` です。
- `.devcontainer/devcontainer.json` に `DISPLAY=:1`、`WEBKIT_DISABLE_DMABUF_RENDERER`、`WEBKIT_DISABLE_COMPOSITING_MODE` を設定済みです。
- 14000番ポートが使用中なら、既に起動しているVite/Tauriを終了してから起動し直します。

ブラウザ表示だけでは Tauri IPC によるファイル操作は使えません。また、シェルと各機能の実接続には残作業があります。現在の状況は [Epic #133](https://github.com/DIO0550/domain-modeler/issues/133) と [README](README.md) を参照してください。

## 3. テストとビルド

```bash
pnpm typecheck
pnpm lint
pnpm exec biome check
pnpm test:run
pnpm test:coverage
cargo test --manifest-path apps/desktop/src-tauri/Cargo.toml
pnpm build
pnpm tauri build
```

Vitest は desktop の設定から全パッケージも収集します。特定のテスト群だけを実行するには:

```bash
pnpm --filter @domain-modeler/desktop exec vitest run integration
pnpm --filter @domain-modeler/desktop exec vitest run packages/canvas-core
pnpm --filter @domain-modeler/desktop exec vitest run packages/model-core
```

フロントエンドは `apps/desktop/dist/`、ネイティブ成果物は通常 `apps/desktop/src-tauri/target/release/`（配布用は `bundle/`）に出力されます。`CARGO_TARGET_DIR` を指定した場合はその出力先を使います。

## 4. Storybook

```bash
pnpm storybook
pnpm build-storybook
```

静的出力先は `storybook-static/` です。`.storybook/main.ts` は `@/` を `apps/desktop/src/` に、core のaliasを各パッケージの公開APIに解決します。Tauri依存は既存の `libs/` 境界で差し替えます。UI変更時は [表示確認規約](rules/ui-verification.md)に沿って、表示と一連の操作を確認します。

## 5. 設定の場所

アプリ名・ウィンドウタイトル・識別子は `apps/desktop/src-tauri/tauri.conf.json`、Rust依存は同ディレクトリの `Cargo.toml` で管理します。アイコンは `apps/desktop/src-tauri/icons/` に同梱されています。差し替える場合はルートから:

```bash
pnpm tauri icon path/to/app-icon.png
```

仕様の入口は [docs/domain-modeler/](docs/domain-modeler/index.md)、実装時の規約は [AGENTS.md](AGENTS.md) です。
