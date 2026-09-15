# domain-modeler

イベントストーミング用の `.dcanvas` キャンバスと、ドメインモデルを記述する `.dmodel` DSL を扱う React / Tauri v2 アプリです。キャンバスからモデルの叩き台を生成するスキャフォールド機能を持ちます。

現在は各機能の実装・統合を進めています。アプリシェルのメニューから新規作成・開く・生成保存への接続、読み込んだ文書と編集画面・自動保存・監視の接続、モデル編集画面の組み込みには残作業があります。個別コンポーネントは Storybook、処理の組み合わせは Vitest で確認できます。進捗は [Epic #133](https://github.com/DIO0550/domain-modeler/issues/133) を参照してください。

## 開発を始める

1. このリポジトリをクローンし、VS Code で開きます。
2. Docker と Dev Containers 拡張機能を用意し、コマンドパレットから **Dev Containers: Reopen in Container** を実行します。
3. リポジトリルートで以下を実行します。Node.js 24 と Rust はコンテナに含まれます。pnpm は `package.json` の `packageManager`（現在 `pnpm@10.33.0`）に合わせます。

```bash
pnpm install --frozen-lockfile
pnpm dev
```

ブラウザで [開発画面](http://localhost:14000) を開けます。別ターミナルで `pnpm storybook` を実行すると [コンポーネントカタログ](http://localhost:6006) を確認できます。

ファイルダイアログ・読み書き・監視などのネイティブ機能は Tauri で確認します。Vite を単独起動している場合は停止してから、ルートで実行してください。

```bash
pnpm tauri dev
```

Tauri の設定・Rust ソースは `apps/desktop/src-tauri/` に同梱済みで、初期化コマンドは不要です。コンテナのデスクトップは [noVNC](http://localhost:16080)（パスワード `vscode`）で開けます。詳細とホスト上での開発は [TAURI_SETUP.md](TAURI_SETUP.md) を参照してください。

## 検証コマンド

すべてリポジトリルートから実行します。

| コマンド | 用途 |
| --- | --- |
| `pnpm typecheck` | workspace の TypeScript 型チェック |
| `pnpm test:run` | desktop と全 core パッケージの Vitest |
| `pnpm test:coverage` | 全テストと coverage/ への出力 |
| `pnpm lint` | oxlint |
| `pnpm exec biome check` | CI と同じ Biome チェック |
| `pnpm build` | フロントエンドを apps/desktop/dist/ にビルド |
| `pnpm build-storybook` | Storybook を storybook-static/ にビルド |
| `pnpm tauri build` | ネイティブアプリをビルド |
| `cargo test --manifest-path apps/desktop/src-tauri/Cargo.toml` | Rust のファイル操作・設定などのテスト |

仕様横断テストだけを実行する場合:

```bash
pnpm --filter @domain-modeler/desktop exec vitest run integration
```

Vitest の設定は `apps/desktop/vite.config.ts` にあり、`packages/` のテストも収集します。結合テストではファイルI/Oをメモリ上の実装に差し替え、パーサー・履歴・タブ状態は実物を通します。OSのダイアログ・実ファイル監視・WebViewの通し動作は Tauri で別途確認してください。

## 仕様と実装規約

- [仕様書一覧](docs/domain-modeler/index.md)
- [キャンバス形式](docs/domain-modeler/canvas-format.md) / [canvas-core](docs/domain-modeler/canvas-core.md) / [キャンバスUI](docs/domain-modeler/canvas-ui.md)
- [DSL](docs/domain-modeler/model-format.md) / [model-core](docs/domain-modeler/model-core.md) / [モデル編集](docs/domain-modeler/model-editor.md)
- [アプリシェル](docs/domain-modeler/app-shell.md) / [保存・監視・IPC](docs/domain-modeler/technical.md) / [スキャフォールド](docs/domain-modeler/scaffold.md)
- [子Issueと進捗](https://github.com/DIO0550/domain-modeler/issues/133)
- [実装規約](AGENTS.md) と `rules/`。UI変更時は `rules/ui-verification.md` の表示・操作確認も行います。

## 含まれるツール

| カテゴリ | ツール / バージョン |
| --- | --- |
| OS | Ubuntu 24.04 |
| Node.js | v24 (nodesource) |
| パッケージマネージャー | pnpm |
| Rust | stable (`rustup` / `rustfmt` / `clippy` / `rust-src`) |
| Tauri CLI | v2 (`@tauri-apps/cli` / Node ベース。`pnpm tauri` で利用) |
| バージョン管理 | Git |
| GitHub CLI | gh |
| フロントエンド | React 19 / Vite 8 / TypeScript 5.8 |
| スタイル | Tailwind CSS v4 (`@tailwindcss/vite`。同梱・任意利用) |
| Lint / Format | Biome / oxlint |
| テスト | Vitest (happy-dom) / Playwright (ブラウザ依存パッケージ込み) |
| UI カタログ | Storybook (ポート 6006 を転送済み) |
| GUI 表示 | desktop-lite (noVNC / VNC。Tauri ウィンドウをブラウザで表示) |
| ターミナル | tmux |
| ネットワーク | ファイアウォール (外向き通信を許可リストで制限。iptables / ipset) |

## VS Code 拡張機能

- [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer)
- [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint)
- [Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode) — 保存時に自動フォーマット

## 前提条件

- [Docker](https://www.docker.com/)
- [Visual Studio Code](https://code.visualstudio.com/)
- [Dev Containers 拡張機能](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers)

## 開発環境のポート

以下のポートがホストへ自動転送されます。

| ポート | 用途 |
| --- | --- |
| 14000 | Vite 開発サーバー |
| 14001 | Vite HMR |
| 6006 | Storybook (任意) |
| 16080 | デスクトップ表示 (noVNC / ブラウザ) |
| 15901 | デスクトップ表示 (VNC クライアント) |

## Tauri ウィンドウの表示（コンテナ内 GUI）

Tauri はデスクトップ GUI アプリのため、コンテナ内に仮想デスクトップ（[desktop-lite](https://github.com/devcontainers/features/tree/main/src/desktop-lite)）を同梱しています。`pnpm tauri dev` で起動したウィンドウは、ブラウザで <http://localhost:16080>（パスワード: `vscode`）、または VNC クライアントで `localhost:15901` から確認できます。

WebView（WebKitGTK）の描画向けに `WEBKIT_DISABLE_DMABUF_RENDERER` / `WEBKIT_DISABLE_COMPOSITING_MODE` / `DISPLAY=:1` を `devcontainer.json` の `containerEnv` に設定済みです。

## ネットワークファイアウォール（外向き通信の制限）

コンテナからの外向き通信（egress）を、`.devcontainer/init-firewall.sh` で **許可リスト方式** に制限しています。開発に必要な宛先（GitHub / npm レジストリ / crates.io / rustup / Anthropic API など）だけを許可し、それ以外への通信はすべて遮断します。意図しない外部への通信を防ぐための安全策です。

- 適用タイミング: コンテナ起動時（`.devcontainer/entrypoint.sh` が root で実行し、その中で `init-firewall.sh` を適用）。再起動のたびに再適用されます。
- 仕組み: `iptables` でデフォルト DROP にし、`ipset` に登録した許可先（GitHub の公開 IP レンジ + 許可ドメインの解決結果）だけを ACCEPT します。DNS・localhost・確立済みコネクション・ホストネットワークは常に許可します。
- 必要な権限: `docker-compose.yml` の `cap_add` に `NET_ADMIN` / `NET_RAW` を付与しています。

許可先を追加したいときは、`.devcontainer/init-firewall.sh` の `ALLOWED_DOMAINS` 配列にドメインを追記してください。ファイアウォールが不要な場合は、`.devcontainer/entrypoint.sh` のファイアウォール適用部分と、`docker-compose.yml` の `cap_add` を削除します。

## sudo を使わない設計（特権分離）

開発セッションのユーザー（`vscode`）には **sudo 権限を付与していません**。特権が必要な初期化（VNC デスクトップ / ファイアウォール）は、コンテナ起動時に root として動く `.devcontainer/entrypoint.sh` で実行します。

- ビルド時のセットアップスクリプトのためだけに sudo を使い、`Dockerfile` の最後で `/etc/sudoers.d/vscode` を削除して実行時には残しません。
- コンテナ本体プロセスは root（エントリポイント）で動きますが、VS Code のセッション・ターミナルは `devcontainer.json` の `remoteUser: vscode` で動くため、日常操作は非 root ユーザーです。
- 実行時に root 権限が必要な作業を追加したい場合は、`entrypoint.sh`（root で実行される）に処理を足すか、`Dockerfile` の `rm -f /etc/sudoers.d/$USERNAME` を削除して従来どおり sudo を許可します。

## プロジェクト構成

| パス | 責務 |
| --- | --- |
| `apps/desktop/src/` | React のシェル、キャンバス・モデル・生成UI、I/O adapter |
| `apps/desktop/src-tauri/` | Rust のファイル操作、監視、ダイアログ、設定と IPC |
| `apps/desktop/vite.config.ts` | Vite / Vitest の設定とパッケージalias |
| `packages/canvas-core/` | キャンバス文書、接続、履歴、JSON入出力 |
| `packages/model-core/` | DSL の字句解析・構文解析・参照解決 |
| `packages/scaffold/` | キャンバスから `.dmodel` テキストへの変換 |
| `docs/domain-modeler/` | 仕様書 |
| `.storybook/` | UIカタログ設定 |
| `.devcontainer/` | Docker / Node / Rust / GUI 開発環境 |
| `rules/` | 設計・コーディング・テスト規約 |
| `pnpm-workspace.yaml` / `package.json` | workspace とルート実行コマンド |

アプリからパッケージへ依存し、core は DOM・React・Tauri に依存しません。scaffold は canvas-core と model-core を利用します。

## カスタマイズ

- **Node.js のバージョン**: `.devcontainer/node/Dockerfile` の `ARG NODE_VERSION` を変更します。
- **転送ポート**: アプリのポート（`14000`/`14001`）は `.devcontainer/devcontainer.json` の `forwardPorts` と `.devcontainer/docker-compose.yml` の `ports` を揃えて変更します。GUI ポート（`16080`/`15901`）は `devcontainer.json` の `features` の `webPort` / `vncPort` と `forwardPorts` を揃えます。
- **GUI パスワード**: `devcontainer.json` の `features` → `desktop-lite` → `password` で変更します。GUI が不要な場合は `features` / `containerEnv` / GUI ポートに加えて、`.devcontainer/entrypoint.sh` の desktop-init 実行部分を削除します。
- **ファイアウォール許可先**: `.devcontainer/init-firewall.sh` の `ALLOWED_DOMAINS` 配列で追加・削除します。ファイアウォール自体が不要な場合は `.devcontainer/entrypoint.sh` の該当部分と `docker-compose.yml` の `cap_add` を削除します。
- **sudo 権限**: 既定では実行時ユーザー(`vscode`)に sudo を付与しません（`Dockerfile` 末尾で sudoers を削除）。従来どおり sudo を使いたい場合は、その `rm -f /etc/sudoers.d/$USERNAME` を削除します。
- **セットアップスクリプト**: `Dockerfile` / `devcontainer.json` はコンテナ構築時に外部 gist（リポジトリオーナーの gist）から gh / pnpm / AI ツール / tmux / Playwright などのセットアップスクリプトを取得します。用途に応じて差し替え・削除してください。

## ライセンス

[MIT](LICENSE)
