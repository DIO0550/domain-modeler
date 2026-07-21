# domain-modeler 実装 Issue 分解案

このファイルは `docs/domain-modeler/` 配下の仕様を、GitHub Issues に登録しやすい粒度へ分解したものです。
各 Issue は原則 **1タスクあたり変更対象 1〜2 ファイル** に収めます。複数ファイルが必要な場合も、実装ファイル + 対応テストの 2 ファイルを上限にします。

> 注意: 登録可能な環境では `GITHUB_REPOSITORY=owner/repo GITHUB_TOKEN=... node scripts/create-domain-modeler-issues.mjs` を実行してください。事前確認だけ行う場合は `DRY_RUN=1 node scripts/create-domain-modeler-issues.mjs` を使ってください。

## Epic

### [Epic] domain-modeler: docs 仕様実装と進行管理

**目的**
- `.dcanvas` キャンバス、`.dmodel` DSL、Tauri デスクトップシェル、スキャフォールド生成を仕様どおりに実装する。
- 依存方向は `apps -> packages` に限定し、core は DOM/Tauri 非依存に保つ。

**完了条件**
- 下記子 Issue がすべて完了している。
- core パッケージは Vitest で仕様主要パスが検証されている。
- デスクトップアプリで新規作成、開く、自動保存、外部変更取り込み、キャンバス編集、モデル編集、スキャフォールド生成が動作する。

## Phase 0: 基盤整備

### 001. [Chore][Repo] pnpm workspace の packages/apps 構成を作成
- **変更対象**: `package.json`, `pnpm-workspace.yaml`
- **内容**: workspace に `packages/*` と `apps/*` を定義し、既存 Vite/Tauri アプリ移動の前提を整える。
- **完了条件**: `pnpm install` が workspace として解決できる。
- **Labels**: `type:chore`, `area:shared`, `priority:P1`, `size:S`

### 002. [Chore][Desktop] 既存フロントエンドを apps/desktop へ移動
- **変更対象**: `src`, `apps/desktop/src`
- **内容**: 既存 React ソースを `apps/desktop/src` に移動し、import が維持されるようにする。
- **完了条件**: desktop アプリの TypeScript build が通る。
- **Labels**: `type:migration`, `area:frontend`, `priority:P1`, `size:S`

### 003. [Chore][Desktop] Tauri 設定を apps/desktop に合わせる
- **変更対象**: `src-tauri/tauri.conf.json`, `apps/desktop/package.json`
- **内容**: dev/build コマンドと distDir を移動後の構成に合わせる。
- **完了条件**: `pnpm tauri dev` の起動先が desktop app になる。
- **Labels**: `type:chore`, `area:server`, `priority:P1`, `size:S`

### 004. [Chore][Config] TypeScript/Vite 設定を workspace 対応にする
- **変更対象**: `tsconfig.json`, `vite.config.ts`
- **内容**: workspace パッケージ参照と path alias の最小設定を追加する。
- **完了条件**: app から package の public API を import できる。
- **Labels**: `type:chore`, `area:shared`, `priority:P1`, `size:S`

## Phase 1: canvas-core

### 005. [Feature][CanvasCore] 型定義と public API 入口を作成
- **変更対象**: `packages/canvas-core/src/index.ts`, `packages/canvas-core/src/types.ts`
- **内容**: Document/Sticky/Connection/Viewport/Anchor/StickyType と Result/Error 型を定義する。
- **完了条件**: UI 層が `index.ts` だけから型を参照できる。
- **Labels**: `type:feature`, `area:shared`, `priority:P1`, `size:S`

### 006. [Feature][CanvasCore] 空キャンバス生成を実装
- **変更対象**: `packages/canvas-core/src/document.ts`, `packages/canvas-core/src/document.test.ts`
- **内容**: version/title/viewport/stickies/connections を持つ初期ドキュメント生成を実装する。
- **完了条件**: title 指定あり/なしの初期値テストが通る。
- **Labels**: `type:feature`, `area:shared`, `priority:P1`, `size:S`

### 007. [Feature][CanvasCore] 付箋 CRUD を実装
- **変更対象**: `packages/canvas-core/src/document.ts`, `packages/canvas-core/src/document.test.ts`
- **内容**: 追加、本文変更、移動、リサイズ、種別変更、前面化、削除を実装する。
- **完了条件**: 入力不変、z順、削除時の connection cascade がテストされている。
- **Labels**: `type:feature`, `area:shared`, `priority:P1`, `size:M`

### 008. [Feature][CanvasCore] 接続 CRUD を実装
- **変更対象**: `packages/canvas-core/src/connections.ts`, `packages/canvas-core/src/connections.test.ts`
- **内容**: 接続追加、ラベル変更、アンカー指定/解除、削除を実装する。
- **完了条件**: 存在しない付箋参照と自己参照がエラーになる。
- **Labels**: `type:feature`, `area:shared`, `priority:P1`, `size:M`

### 009. [Feature][CanvasCore] ID 採番を実装
- **変更対象**: `packages/canvas-core/src/ids.ts`, `packages/canvas-core/src/ids.test.ts`
- **内容**: `stk_` / `con_` + UUID 先頭12桁の採番関数を実装する。
- **完了条件**: prefix と文字数をテストし、ID 生成器差し替えができる。
- **Labels**: `type:feature`, `area:shared`, `priority:P1`, `size:S`

### 010. [Feature][CanvasCore] viewport 変換とズームを実装
- **変更対象**: `packages/canvas-core/src/viewport.ts`, `packages/canvas-core/src/viewport.test.ts`
- **内容**: world/screen 変換、pan、カーソル不動点 zoom、0.1〜4.0 clamp を実装する。
- **完了条件**: 表駆動テストで変換の往復と clamp が確認されている。
- **Labels**: `type:feature`, `area:shared`, `priority:P1`, `size:S`

### 011. [Feature][CanvasCore] 付箋ヒットテストを実装
- **変更対象**: `packages/canvas-core/src/hitTest.ts`, `packages/canvas-core/src/hitTest.test.ts`
- **内容**: ワールド座標による矩形判定と前面優先を実装する。
- **完了条件**: 重なった付箋で配列後方が選択される。
- **Labels**: `type:feature`, `area:shared`, `priority:P1`, `size:S`

### 012. [Feature][CanvasCore] 接続アンカー解決と線ヒットテストを実装
- **変更対象**: `packages/canvas-core/src/hitTest.ts`, `packages/canvas-core/src/hitTest.test.ts`
- **内容**: 明示/自動アンカー解決、接続線距離判定を実装する。
- **完了条件**: tolerance/zoom 換算を呼び出し側で渡す前提のテストがある。
- **Labels**: `type:feature`, `area:shared`, `priority:P1`, `size:M`

### 013. [Feature][CanvasCore] 接続ルール警告を実装
- **変更対象**: `packages/canvas-core/src/rules.ts`, `packages/canvas-core/src/rules.test.ts`
- **内容**: 許可リスト方式と hotspot 常時 OK を実装する。
- **完了条件**: 全許可ペア、不許可ペア、hotspot ペアのテストがある。
- **Labels**: `type:feature`, `area:shared`, `priority:P1`, `size:S`

### 014. [Feature][CanvasCore] JSON 読み込み検証を実装
- **変更対象**: `packages/canvas-core/src/serialize.ts`, `packages/canvas-core/src/serialize.test.ts`
- **内容**: version、viewport、sticky、connection、ID 一意性、参照整合性を検証する。
- **完了条件**: 未知フィールド無視、zoom clamp、major mismatch エラーがテストされている。
- **Labels**: `type:feature`, `area:shared`, `priority:P1`, `size:M`

### 015. [Feature][CanvasCore] JSON 書き出しと note 再生成を実装
- **変更対象**: `packages/canvas-core/src/serialize.ts`, `packages/canvas-core/src/serialize.test.ts`
- **内容**: 2スペース整形、キー順固定、note 派生生成を実装する。
- **完了条件**: note の20文字切り詰め、改行スペース化、往復同値性がテストされている。
- **Labels**: `type:feature`, `area:shared`, `priority:P1`, `size:M`

### 016. [Feature][CanvasCore] undo/redo 履歴を実装
- **変更対象**: `packages/canvas-core/src/history.ts`, `packages/canvas-core/src/history.test.ts`
- **内容**: snapshot 履歴、上限100、transaction begin/commit、redo 破棄を実装する。
- **完了条件**: viewport/選択状態を履歴対象にしない設計でテストされている。
- **Labels**: `type:feature`, `area:shared`, `priority:P1`, `size:M`

### 017. [Feature][CanvasCore] 外部変更取り込み API を実装
- **変更対象**: `packages/canvas-core/src/externalChanges.ts`, `packages/canvas-core/src/externalChanges.test.ts`
- **内容**: 外部 JSON を検証し、成功時に履歴付き置換、失敗時に現状維持する API を実装する。
- **完了条件**: 成功/失敗/undo 可能性のテストがある。
- **Labels**: `type:feature`, `area:shared`, `priority:P1`, `size:S`

## Phase 2: model-core

### 018. [Feature][ModelCore] DSL token 型と tokenizer を実装
- **変更対象**: `packages/model-core/src/tokenize.ts`, `packages/model-core/src/tokenize.test.ts`
- **内容**: コメント、空行、予約語、識別子、インデント、位置情報を token 化する。
- **完了条件**: 日本語識別子、予約語拒否、コメント位置のテストがある。
- **Labels**: `type:feature`, `area:shared`, `priority:P1`, `size:M`

### 019. [Feature][ModelCore] AST 型と public API 入口を作成
- **変更対象**: `packages/model-core/src/index.ts`, `packages/model-core/src/ast.ts`
- **内容**: Document/DataDecl/WorkflowDecl/TypeExpr/Diagnostic/SourceRange を定義する。
- **完了条件**: UI が `index.ts` だけから AST/診断型を参照できる。
- **Labels**: `type:feature`, `area:shared`, `priority:P1`, `size:S`

### 020. [Feature][ModelCore] data 宣言パーサーを実装
- **変更対象**: `packages/model-core/src/parse.ts`, `packages/model-core/src/parse.data.test.ts`
- **内容**: 単一参照、AND、OR、後置修飾、制約構文を解析する。
- **完了条件**: AND/OR 混在、下限>上限、bool/date 制約がエラーになる。
- **Labels**: `type:feature`, `area:shared`, `priority:P1`, `size:M`

### 021. [Feature][ModelCore] workflow 宣言パーサーを実装
- **変更対象**: `packages/model-core/src/parse.ts`, `packages/model-core/src/parse.workflow.test.ts`
- **内容**: input/output/error 行、順序固定、AND/OR 制約を解析する。
- **完了条件**: error 省略、行順違反、output の AND 不可がテストされている。
- **Labels**: `type:feature`, `area:shared`, `priority:P1`, `size:M`

### 022. [Feature][ModelCore] エラー回復パーサーを実装
- **変更対象**: `packages/model-core/src/parse.ts`, `packages/model-core/src/parse.recovery.test.ts`
- **内容**: 不正宣言があっても次宣言から解析を継続する。
- **完了条件**: AST と複数 diagnostics が同時に返る。
- **Labels**: `type:feature`, `area:shared`, `priority:P1`, `size:M`

### 023. [Feature][ModelCore] 参照解決と未定義警告を実装
- **変更対象**: `packages/model-core/src/resolve.ts`, `packages/model-core/src/resolve.test.ts`
- **内容**: data 宣言名を収集し、未定義参照を warning、重複宣言を error にする。
- **完了条件**: 前方参照は警告にならず、コメント中は対象外になる。
- **Labels**: `type:feature`, `area:shared`, `priority:P1`, `size:S`

### 024. [Feature][ModelCore] rename 用 token range 収集を実装
- **変更対象**: `packages/model-core/src/rename.ts`, `packages/model-core/src/rename.test.ts`
- **内容**: 宣言名と参照位置に基づく一括置換範囲を返す。
- **完了条件**: コメント内文字列を置換せず、同名 token のみ置換する。
- **Labels**: `type:feature`, `area:shared`, `priority:P2`, `size:M`

### 025. [Feature][ModelCore] スタブ生成テキスト API を実装
- **変更対象**: `packages/model-core/src/stub.ts`, `packages/model-core/src/stub.test.ts`
- **内容**: `data <名前> = string // TODO 詳細化` を生成し、予約語/空名を拒否する。
- **完了条件**: model-editor と scaffold が同一 API を使える。
- **Labels**: `type:feature`, `area:shared`, `priority:P2`, `size:S`

## Phase 3: Rust/Tauri 基盤

### 026. [Feature][Tauri] ファイル読み込み IPC を実装
- **変更対象**: `src-tauri/src/lib.rs`, `src-tauri/src/lib_test.rs`
- **内容**: パスを受けて UTF-8 文字列を返す command を追加する。
- **完了条件**: 存在しないファイル/UTF-8 エラーが値として返る。
- **Labels**: `type:feature`, `area:server`, `priority:P1`, `size:S`

### 027. [Feature][Tauri] アトミック書き込み IPC を実装
- **変更対象**: `src-tauri/src/lib.rs`, `src-tauri/src/lib_test.rs`
- **内容**: 同一ディレクトリの一時ファイルへ書き、rename で置換する。
- **完了条件**: 正常書き込みと失敗時に既存ファイルが壊れないことをテストする。
- **Labels**: `type:feature`, `area:server`, `priority:P1`, `size:M`

### 028. [Feature][Tauri] 保存/開くダイアログ IPC を実装
- **変更対象**: `src-tauri/src/lib.rs`, `src-tauri/tauri.conf.json`
- **内容**: `.dcanvas` / `.dmodel` フィルタ付きダイアログを提供する。
- **完了条件**: キャンセル時は null、選択時は path を返す。
- **Labels**: `type:feature`, `area:server`, `priority:P1`, `size:S`

### 029. [Feature][Tauri] ファイル監視 IPC を実装
- **変更対象**: `src-tauri/src/lib.rs`, `src-tauri/Cargo.toml`
- **内容**: 監視開始/停止と change/delete イベント送出を実装する。
- **完了条件**: 200ms debounce と削除イベント通知が動作する。
- **Labels**: `type:feature`, `area:server`, `priority:P1`, `size:M`

### 030. [Feature][Tauri] アプリ設定読み書きを実装
- **変更対象**: `src-tauri/src/lib.rs`, `src-tauri/src/lib_test.rs`
- **内容**: OS 標準設定ディレクトリに JSON でタブ/ウィンドウ/テーマ設定を保存する。
- **完了条件**: 壊れた設定ファイルでも既定値で起動する。
- **Labels**: `type:feature`, `area:server`, `priority:P2`, `size:M`

## Phase 4: App shell

### 031. [Feature][AppShell] タブ状態モデルと reducer を実装
- **変更対象**: `apps/desktop/src/appShell/tabs.ts`, `apps/desktop/src/appShell/tabs.test.ts`
- **内容**: タブ追加、二重オープン防止、active 切替、欠損状態、背景変更マークを扱う。
- **完了条件**: 同一 path open は既存タブを active にする。
- **Labels**: `type:feature`, `area:frontend`, `priority:P1`, `size:M`

### 032. [Feature][AppShell] タブ UI を実装
- **変更対象**: `apps/desktop/src/App.tsx`, `apps/desktop/src/App.css`
- **内容**: 文書種別アイコン、ファイル名、未変換の親ディレクトリ補足、警告/変更マークを表示する。
- **完了条件**: active/background/missing の表示状態が確認できる。
- **Labels**: `type:feature`, `area:frontend`, `priority:P1`, `size:M`

### 033. [Feature][AppShell] 新規作成フローを実装
- **変更対象**: `apps/desktop/src/appShell/fileActions.ts`, `apps/desktop/src/appShell/fileActions.test.ts`
- **内容**: 種別選択後すぐ保存ダイアログを開き、初期内容を書いてからタブを開く。
- **完了条件**: 無題文書を作らず、キャンセル時は状態変化しない。
- **Labels**: `type:feature`, `area:frontend`, `priority:P1`, `size:M`

### 034. [Feature][AppShell] ファイルを開くフローを実装
- **変更対象**: `apps/desktop/src/appShell/fileActions.ts`, `apps/desktop/src/appShell/fileActions.test.ts`
- **内容**: メニュー/ドラッグ&ドロップ/関連付け入口で拡張子・読み込み・検証を処理する。
- **完了条件**: 不正 `.dcanvas` はタブを開かず通知し、`.dmodel` は内容に関わらず開く。
- **Labels**: `type:feature`, `area:frontend`, `priority:P1`, `size:M`

### 035. [Feature][AppShell] 自動保存スケジューラを実装
- **変更対象**: `apps/desktop/src/appShell/autoSave.ts`, `apps/desktop/src/appShell/autoSave.test.ts`
- **内容**: 500ms debounce、最大2秒保存、transaction 中遅延、閉じる時即時保存を実装する。
- **完了条件**: fake timer で debounce と max interval を検証する。
- **Labels**: `type:feature`, `area:frontend`, `priority:P1`, `size:M`

### 036. [Feature][AppShell] 外部変更通知と自己書き込み判別を実装
- **変更対象**: `apps/desktop/src/appShell/externalFileEvents.ts`, `apps/desktop/src/appShell/externalFileEvents.test.ts`
- **内容**: 保存ハッシュ一致イベント無視、外部変更取り込み、背景タブ変更マーク、失敗 toast を実装する。
- **完了条件**: active 成功は通知なし、background 成功はドット表示になる。
- **Labels**: `type:feature`, `area:frontend`, `priority:P1`, `size:M`

### 037. [Feature][AppShell] メニューとコマンド有効状態を実装
- **変更対象**: `apps/desktop/src/appShell/menu.ts`, `apps/desktop/src/App.tsx`
- **内容**: 新規、開く、閉じる、undo/redo、生成メニューを実装し、生成は canvas active 時のみ有効にする。
- **完了条件**: active document type に応じて menu state が変わる。
- **Labels**: `type:feature`, `area:frontend`, `priority:P2`, `size:S`

## Phase 5: Canvas UI

### 038. [Feature][CanvasUI] キャンバス画面レイアウトとツールバーを実装
- **変更対象**: `apps/desktop/src/canvas/CanvasView.tsx`, `apps/desktop/src/canvas/CanvasView.css`
- **内容**: 左ツールパレット、無限キャンバス領域、ステータス/保存済み表示を作る。
- **完了条件**: 8種付箋ボタンと zoom 表示がある。
- **Labels**: `type:feature`, `area:frontend`, `priority:P1`, `size:M`

### 039. [Feature][CanvasUI] 付箋表示コンポーネントを実装
- **変更対象**: `apps/desktop/src/canvas/Sticky.tsx`, `apps/desktop/src/canvas/Sticky.css`
- **内容**: 種別ごとの色、標準サイズ、本文表示、改行、省略を実装する。
- **完了条件**: 8種すべての visual state が表示できる。
- **Labels**: `type:feature`, `area:frontend`, `priority:P1`, `size:S`

### 040. [Feature][CanvasUI] 付箋作成・選択・編集を実装
- **変更対象**: `apps/desktop/src/canvas/useStickyInteractions.ts`, `apps/desktop/src/canvas/useStickyInteractions.test.ts`
- **内容**: ツール選択→クリック作成、選択、ダブルクリック/Enter 編集、Esc/blur 確定を実装する。
- **完了条件**: テキスト編集は1 undo 単位になる。
- **Labels**: `type:feature`, `area:frontend`, `priority:P1`, `size:M`

### 041. [Feature][CanvasUI] 付箋ドラッグ・リサイズを実装
- **変更対象**: `apps/desktop/src/canvas/useStickyDragResize.ts`, `apps/desktop/src/canvas/useStickyDragResize.test.ts`
- **内容**: ドラッグ移動、リサイズ、transaction 確定を実装する。
- **完了条件**: 連続 pointermove が1 undo 単位になる。
- **Labels**: `type:feature`, `area:frontend`, `priority:P1`, `size:M`

### 042. [Feature][CanvasUI] 接続線描画を実装
- **変更対象**: `apps/desktop/src/canvas/ConnectionLayer.tsx`, `apps/desktop/src/canvas/ConnectionLayer.css`
- **内容**: SVG レイヤー、矢印、ラベル、警告時の点線/色を描画する。
- **完了条件**: core のアンカー解決とルール判定結果を使って表示する。
- **Labels**: `type:feature`, `area:frontend`, `priority:P1`, `size:M`

### 043. [Feature][CanvasUI] 接続作成・選択・削除を実装
- **変更対象**: `apps/desktop/src/canvas/useConnectionInteractions.ts`, `apps/desktop/src/canvas/useConnectionInteractions.test.ts`
- **内容**: 接続モード、始点/終点選択、ラベル編集、Delete 削除を実装する。
- **完了条件**: 自己参照は UI で作成されず、core エラーも表示できる。
- **Labels**: `type:feature`, `area:frontend`, `priority:P1`, `size:M`

### 044. [Feature][CanvasUI] pan/zoom 操作を実装
- **変更対象**: `apps/desktop/src/canvas/useViewportInteractions.ts`, `apps/desktop/src/canvas/useViewportInteractions.test.ts`
- **内容**: スペース+ドラッグ/中ボタン pan、ホイール/pinch zoom、ショートカット reset を実装する。
- **完了条件**: カーソル下のワールド座標が zoom 前後で維持される。
- **Labels**: `type:feature`, `area:frontend`, `priority:P1`, `size:M`

### 045. [Feature][CanvasUI] キーボードショートカットを実装
- **変更対象**: `apps/desktop/src/canvas/shortcuts.ts`, `apps/desktop/src/canvas/shortcuts.test.ts`
- **内容**: undo/redo、delete、copy/paste、front、zoom 操作を実装する。
- **完了条件**: テキスト編集中は編集標準キーを妨げない。
- **Labels**: `type:feature`, `area:frontend`, `priority:P2`, `size:S`

## Phase 6: Model editor UI

### 046. [Feature][ModelEditor] テキストエディタ基盤を実装
- **変更対象**: `apps/desktop/src/model/ModelEditor.tsx`, `apps/desktop/src/model/ModelEditor.css`
- **内容**: textarea/contenteditable ベースの editor、行番号、選択/カーソル保持を実装する。
- **完了条件**: `.dmodel` テキスト全体が唯一の真実として保持される。
- **Labels**: `type:feature`, `area:frontend`, `priority:P1`, `size:M`

### 047. [Feature][ModelEditor] シンタックスハイライトを実装
- **変更対象**: `apps/desktop/src/model/highlight.ts`, `apps/desktop/src/model/highlight.test.ts`
- **内容**: keyword、primitive、comment、diagnostic range の分類を実装する。
- **完了条件**: model-core tokenizer の位置情報と整合する。
- **Labels**: `type:feature`, `area:frontend`, `priority:P1`, `size:S`

### 048. [Feature][ModelEditor] 入力挙動と undo 境界を実装
- **変更対象**: `apps/desktop/src/model/useTextEditing.ts`, `apps/desktop/src/model/useTextEditing.test.ts`
- **内容**: Tab のスペース挿入、auto indent、IME 中の外部変更遅延、編集 session 境界を実装する。
- **完了条件**: IME composition 中に外部反映されない。
- **Labels**: `type:feature`, `area:frontend`, `priority:P1`, `size:M`

### 049. [Feature][ModelEditor] 構造化プレビュー data カードを実装
- **変更対象**: `apps/desktop/src/model/PreviewDataCard.tsx`, `apps/desktop/src/model/PreviewDataCard.css`
- **内容**: data 宣言を alias/choice/record/constrained としてカード表示する。
- **完了条件**: 未定義参照バッジを表示できる。
- **Labels**: `type:feature`, `area:frontend`, `priority:P1`, `size:S`

### 050. [Feature][ModelEditor] 構造化プレビュー workflow カードを実装
- **変更対象**: `apps/desktop/src/model/PreviewWorkflowCard.tsx`, `apps/desktop/src/model/PreviewWorkflowCard.css`
- **内容**: input/output/error を列表示し、型参照をクリック可能にする。
- **完了条件**: error なし workflow も自然に表示される。
- **Labels**: `type:feature`, `area:frontend`, `priority:P1`, `size:S`

### 051. [Feature][ModelEditor] 診断表示を実装
- **変更対象**: `apps/desktop/src/model/Diagnostics.tsx`, `apps/desktop/src/model/Diagnostics.css`
- **内容**: パースエラーを赤、未定義参照を黄で editor/preview に表示する。
- **完了条件**: 書き途中の警告は穏やかに表示され、保存は妨げない。
- **Labels**: `type:feature`, `area:frontend`, `priority:P1`, `size:S`

### 052. [Feature][ModelEditor] 定義ジャンプとスタブ生成を実装
- **変更対象**: `apps/desktop/src/model/previewActions.ts`, `apps/desktop/src/model/previewActions.test.ts`
- **内容**: 参照クリックで該当宣言へ移動し、未定義バッジから末尾に data stub を追加する。
- **完了条件**: スタブ生成直後に追加行へジャンプする。
- **Labels**: `type:feature`, `area:frontend`, `priority:P2`, `size:M`

### 053. [Feature][ModelEditor] リネームと雛形挿入を実装
- **変更対象**: `apps/desktop/src/model/previewActions.ts`, `apps/desktop/src/model/previewActions.test.ts`
- **内容**: token range に基づく rename、data/workflow 雛形挿入と名前選択を実装する。
- **完了条件**: コメント内を置換せず、undo で一括編集を戻せる。
- **Labels**: `type:feature`, `area:frontend`, `priority:P2`, `size:M`

## Phase 7: Scaffold generation

### 054. [Feature][Scaffold] 識別子化ロジックを実装
- **変更対象**: `packages/scaffold/src/identifier.ts`, `packages/scaffold/src/identifier.test.ts`
- **内容**: 空白/改行の `_` 置換、空文字除外、予約語 suffix、同一テキスト統合を実装する。
- **完了条件**: 日本語・予約語・重複・空文字ケースがテストされている。
- **Labels**: `type:feature`, `area:shared`, `priority:P1`, `size:S`

### 055. [Feature][Scaffold] data スタブ変換を実装
- **変更対象**: `packages/scaffold/src/generate.ts`, `packages/scaffold/src/generate.data.test.ts`
- **内容**: Event/Aggregate/Read Model/Command input data/hotspot/未変換コメントを出力する。
- **完了条件**: 付箋配列順で出力され、Actor/External System は未変換欄に残る。
- **Labels**: `type:feature`, `area:shared`, `priority:P1`, `size:M`

### 056. [Feature][Scaffold] Command workflow 変換を実装
- **変更対象**: `packages/scaffold/src/generate.ts`, `packages/scaffold/src/generate.command.test.ts`
- **内容**: Command から workflow、input コマンド data、output Event OR、接続ラベルコメントを生成する。
- **完了条件**: Event なしは `TODO結果イベント`、非 Event 接続は workflow 直前コメントになる。
- **Labels**: `type:feature`, `area:shared`, `priority:P1`, `size:M`

### 057. [Feature][Scaffold] Policy workflow 変換を実装
- **変更対象**: `packages/scaffold/src/generate.ts`, `packages/scaffold/src/generate.policy.test.ts`
- **内容**: Policy から Event input、TODO output、接続先 Command コメントを生成する。
- **完了条件**: Event 入力なしは `TODOトリガーイベント` になる。
- **Labels**: `type:feature`, `area:shared`, `priority:P1`, `size:M`

### 058. [Feature][Scaffold] 生成確認画面を実装
- **変更対象**: `apps/desktop/src/scaffold/ScaffoldPreview.tsx`, `apps/desktop/src/scaffold/ScaffoldPreview.css`
- **内容**: 生成全文の read-only 確認画面、確定/キャンセルを表示する。
- **完了条件**: キャンセル時は保存ダイアログもファイル作成も行わない。
- **Labels**: `type:feature`, `area:frontend`, `priority:P2`, `size:S`

### 059. [Feature][Scaffold] 生成保存フローを実装
- **変更対象**: `apps/desktop/src/scaffold/scaffoldAction.ts`, `apps/desktop/src/scaffold/scaffoldAction.test.ts`
- **内容**: active canvas から生成し、確認後に新規 `.dmodel` として保存してタブで開く。
- **完了条件**: 既存ファイルへの追記/上書きをせず、新規タブが開く。
- **Labels**: `type:feature`, `area:frontend`, `priority:P2`, `size:M`

## Phase 8: 品質・ドキュメント

### 060. [Test][Core] canvas-core 仕様横断テストを追加
- **変更対象**: `packages/canvas-core/src/integration.test.ts`
- **内容**: 作成→編集→接続→serialize→parse→undo の代表シナリオをテストする。
- **完了条件**: note/キー順を除く構造同値性を確認する。
- **Labels**: `type:test`, `area:shared`, `priority:P2`, `size:S`

### 061. [Test][Core] model-core 仕様横断テストを追加
- **変更対象**: `packages/model-core/src/integration.test.ts`
- **内容**: 複数 data/workflow/未定義警告/重複エラーを含む代表文書をテストする。
- **完了条件**: AST と diagnostics が期待どおり返る。
- **Labels**: `type:test`, `area:shared`, `priority:P2`, `size:S`

### 062. [Test][Desktop] app-shell ファイル操作結合テストを追加
- **変更対象**: `apps/desktop/src/appShell/fileActions.integration.test.ts`
- **内容**: 新規作成、開く、不正 canvas、model パースエラー許容、欠損状態をテストする。
- **完了条件**: IPC は薄い adapter として差し替え可能になっている。
- **Labels**: `type:test`, `area:frontend`, `priority:P2`, `size:S`

### 063. [Docs] 実装後 README に開発手順を追記
- **変更対象**: `README.md`, `TAURI_SETUP.md`
- **内容**: workspace 構成、開発起動、テスト、Tauri 起動、仕様書へのリンクを追記する。
- **完了条件**: 初回 contributor が README だけで開発開始できる。
- **Labels**: `type:docs`, `area:shared`, `priority:P3`, `size:S`

## GitHub 登録用メモ

`GITHUB_REPOSITORY=owner/repo GITHUB_TOKEN=... node scripts/create-domain-modeler-issues.mjs` を実行すると、このファイルの Epic と子 Issue を GitHub Issues に登録できます。事前確認だけ行う場合は `DRY_RUN=1 node scripts/create-domain-modeler-issues.mjs` を使ってください。
