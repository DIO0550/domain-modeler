# モデル依存図 — 受入検証記録（#286）

検証日: 2026-10-18 / 対象: #312までの実装と本PRの追加テスト。

## 検証範囲と判定

Vitest（happy-dom）で実際のDSL解析・参照解決・図生成・配置・編集履歴・文書セッションを通す。ファイルIPCとDOM寸法だけをフェイクにする。以下の「自動」はこの範囲の確認を指し、ブラウザの描画やOSの実ファイル監視を検証した意味ではない。

表示・実操作の確認は未完了。playwright-cliは実行ファイルを起動できたが、ローカルChromeがなく、公式Chromium配布のダウンロードも有効なZIPを取得できなかった。クラウドブラウザから開発サーバー `http://127.0.0.1:14000` への接続も `ERR_CONNECTION_REFUSED` だった。スクリーンショットは取得できていない。Tauri実機も利用できないため、これらを受入済みとは扱わない。

## 受入条件と自動テストの対応

表のファイル名は直下のリンク一覧で配置を特定できる。テスト名には検証する振る舞いを記している。UI-08はDOMの文字列検証だけではレイアウトの合否を判断できない。

| ID | 確認内容 | テスト | 結果 |
| --- | --- | --- | --- |
| UI-01 | 選択の両方向の直接接続だけを強調 | dependencyView.selection.test.tsx | 自動確認 |
| UI-02 | workflowの入力・出力・エラーを文字と方向で区別 | dependencyView.normal.test.tsx | 自動確認 |
| UI-03 | 別ノード選択で直接近傍へ更新 | dependencyView.related.test.tsx | 自動確認 |
| UI-04 | 全体復帰時に全ノード・辺と選択を復元 | dependencyView.related.test.tsx | 自動確認 |
| UI-05 | 実エディタの宣言範囲へ移動・フォーカス | modelDiagnostics.dependency-navigation.test.tsx | 自動確認 |
| UI-06 | 未定義の架空本文を出さず役割別参照箇所へ移動 | modelDiagnostics.dependency-navigation.test.tsx | 自動確認 |
| UI-07 | 最初のフォーカス以降、Tab・Enter・Spaceで選択→関連のみ→定義編集→図へ復帰 | modelDiagnostics.dependency-keyboard.test.tsx / DependencyKeyboard story | 自動確認。実ブラウザは未確認 |
| UI-08 | 狭いウインドウで操作・詳細の重なりを防ぎ全文を閲覧 | LongContent story / dependencyCardBody.normal.test.tsx | 文字列の保持は自動確認。レイアウトは未確認 |
| CORE-01 | 受入サンプル9ノード・9辺、直接近傍5ノード・4辺 | model-graph.normal.test.ts | 自動確認 |
| CORE-02 | 同じ対象の複数役割・位置を1辺へ保持 | model-graph.normal.test.ts | 自動確認 |
| CORE-03 | AND・OR・修飾順・制約を保持 | model-graph.normal.test.ts | 自動確認 |
| CORE-04 | 後方定義への参照 | model-graph.normal.test.ts | 自動確認 |
| CORE-05 | 未定義ノードを共有して全参照を保持 | model-graph.edge.test.ts | 自動確認 |
| CORE-06 | 循環・自己参照の全辺を保持し停止 | model-graph.edge.test.ts | 自動確認 |
| CORE-07 | 重複名は先頭へ解決し後続の診断を保持 | model-graph.edge.test.ts | 自動確認 |
| CORE-08 | マシンのイベント名を型参照にしない | model-graph.edge.test.ts | 自動確認 |
| CORE-09 | 対象外宣言への解決を未定義と混同しない | model-graph.edge.test.ts | 自動確認 |
| CORE-10 | 破損宣言後の正常宣言を保持 | model-graph.edge.test.ts | 自動確認 |
| SYNC-01 | 表示・モード・閲覧操作で保存本文を変えない | dependency-sync.integration.test.tsx / dependency-acceptance.integration.test.tsx | 自動確認 |
| SYNC-02 | マシンとの往復で選択・表示範囲・パン・ズームを保持 | dependency-sync.integration.test.tsx | 自動確認 |
| SYNC-03 | 本文の追加削除・リネーム・スタブ生成を反映 | dependency-sync.integration.test.tsx / dependency-sync.editing.test.tsx | 自動確認 |
| SYNC-04 | 本文と同じUndo/Redoで図を復元 | dependency-sync.integration.test.tsx / dependency-sync.editing.test.tsx | 自動確認 |
| SYNC-05 | 外部変更後に古い計測が届いても最新本文を維持 | dependency-sync.external.test.tsx | 自動確認 |
| SYNC-06 | 対象削除・識別不能時は選択解除し全体へ復帰 | dependency-sync.integration.test.tsx / dependency-sync.editing.test.tsx | 自動確認 |
| SYNC-07 | 未定義名のスタブ生成で定義ノードへ置換 | dependency-sync.editing.test.tsx | 自動確認 |
| SYNC-08 | 先頭行追加後も最新の編集位置へ移動 | dependency-sync.external.test.tsx | 自動確認 |
| SYNC-09 | タブごとのノード・選択・詳細・表示位置の独立 | dependency-sync.integration.test.tsx | 自動確認 |
| SYNC-10 | 保存・再読込で参照方向と役割を復元。初回保存の失敗から再試行可能 | dependency-acceptance.integration.test.tsx / dependency-sync.integration.test.tsx | 自動確認 |
| SYNC-11 | 読み込み・UTF-8復号失敗で採用済み本文を保持 | dependency-sync.external.test.tsx | 自動確認 |
| SYNC-12 | 外部から採用した部分ASTと診断を同じ本文で表示 | dependency-sync.external.test.tsx | 自動確認 |

テストの配置:

- [コア正常系](../../../packages/model-core/src/model-graph/__tests__/model-graph.normal.test.ts) / [コア境界・異常系](../../../packages/model-core/src/model-graph/__tests__/model-graph.edge.test.ts)
- [依存図の画面テスト](../../../apps/desktop/src/features/model/components/dependency-view/__tests__) / [カード本文テスト](../../../apps/desktop/src/features/model/components/dependency-view/card/__tests__/dependencyCardBody.normal.test.tsx)
- [実エディタへの移動](../../../apps/desktop/src/features/model/components/model-diagnostics/__tests__/modelDiagnostics.dependency-navigation.test.tsx) / [キーボード](../../../apps/desktop/src/features/model/components/model-diagnostics/__tests__/modelDiagnostics.dependency-keyboard.test.tsx)
- [文書同期・保存・タブ](../../../apps/desktop/src/appShell/__tests__/dependency-sync.integration.test.tsx) / [編集](../../../apps/desktop/src/appShell/__tests__/dependency-sync.editing.test.tsx) / [外部変更](../../../apps/desktop/src/appShell/__tests__/dependency-sync.external.test.tsx)
- [新規文書の初回保存・再読込と保存失敗](../../../apps/desktop/src/appShell/__tests__/dependency-acceptance.integration.test.tsx)

## 再現コマンド

Node.js 24、`pnpm@10.33.0`を使用し、リポジトリルートで実行する。

```bash
pnpm install --frozen-lockfile
pnpm typecheck
pnpm exec biome check
pnpm lint
pnpm run check:boundaries
pnpm test:run
pnpm build
pnpm build-storybook
```

依存図と文書シナリオだけを実行する場合:

```bash
pnpm --filter @domain-modeler/desktop exec vitest run dependency model-graph model-modes new-document
```

既存エディタ・ステートマシン・保存の回帰は、全体テストと `model-modes*.integration.test.tsx`、`new-document.integration.test.tsx` も通して確認する。Rustの変更はない。macOS / WindowsのRust CI結果とTauri実機操作は別の検証とする。

## 今回の自動検証結果

- TypeScript型チェック、Biome、oxlint、モジュール境界検査: 成功。
- Vitest: **352ファイル・2494テスト成功**。新規文書の初回保存・保存失敗、連続キーボード操作、3規模の計測文書を追加。
- Viteの本番ビルド、Storybookの静的ビルド: 成功。ビルド成功を表示確認の代わりにはしない。
- Rust / Tauri実機、スクリーンショット、表示応答計測: 未実施。Issueの受入全体を完了扱いにしない。

## 性能計測

計測文書は[フィクスチャ](../../../apps/desktop/src/features/model/components/model-diagnostics/__tests__/dependency-performance.test-support.ts)で生成する。1組は10宣言・13辺（ALIAS4、RECORD2、CHOICE2、VALUE1、WORKFLOW1）。日本語名・AND・OR・list / option・範囲制約・workflowの3役割を含み、複数組は非連結成分になる。最大500宣言まで欠落・診断なしで配置できることを通常のテストでも確認する。これは任意の500宣言文書を保証する上限ではない。高密度グラフ・非常に長い単一宣言・1000宣言以上は未測定。

```bash
pnpm --filter @domain-modeler/desktop exec vitest bench --run dependency-performance --outputJson=dependency-benchmark.json
```

2026-10-18、Ubuntu 24.04.3、AMD EPYC 9V74（実行環境から9論理CPU、メモリ10GiBが見える）、Node.js 24.19.0、Vitest 4.1.4 / happy-dom 20.8.9。各ケース200msウォームアップ後、500ms以上・最低10サンプル。カード寸法は280×220pxに固定。解析・参照解決・カード生成・配置のCPU区間を計測した。DOM描画、フォント計測、React更新、画面へのpaint、ファイルI/Oは含まない。

| 宣言 / 辺 | UTF-8バイト数 | サンプル数 | 平均ms | p99 ms | 最大ms |
| --- | --- | --- | --- | --- | --- |
| 10 / 13 | 504 | 4980 | 0.1004 | 0.3265 | 0.7622 |
| 100 / 130 | 5049 | 244 | 2.0574 | 3.2411 | 4.7964 |
| 500 / 650 | 26169 | 10 | 58.8857 | 62.0043 | 62.0043 |

CPU区間の再計測時の目安は同等環境で100宣言p99 10ms以内、500宣言p99 100ms以内とする。今回のCPU測定はこの範囲に収まるが、CI共有マシンでは厳密な時間アサーションを行わない。

**表示応答は未計測・未達成判定**。必要な暫定目標は100宣言の初回表示500ms以内、選択・関連表示200ms以内（各p95）。同じ環境・ブラウザ・表示寸法でウォームアップ2回と本計測20回を行い、入力イベントから、期待ノード・辺が揃った後の2回目のrequestAnimationFrameまでを計る。OS・CPU・ブラウザ/WebViewバージョン・テーマ・viewport・文書バイト数と分布を記録する。モジュールロードを含むコールド起動は別に計る。500宣言の表示目標は実測後に設定する。

## 未確認のブラウザ・実機項目

次の項目はすべて未確認。完了時に環境・操作・結果・スクリーンショット取得コマンドを追記する。

| 環境・条件 | 操作と確認点 |
| --- | --- |
| ブラウザ1280×720以上、ライト/ダーク | 新規文書へ受入サンプルを入力→依存図→選択→関連のみ→別モデル→全体→定義を編集→図へ戻る。カード・線・ラベル・選択枠と文字の可読性 |
| ブラウザ640×720、ライト/ダーク | LongContent storyで長い日本語を選択。ツールバーの折り返し、下部インスペクターとの非重複、全文のスクロール閲覧 |
| ブラウザの連続キーボード | DependencyKeyboard storyを実行。実際のフォーカスがある要素からTab・Shift+Tab・Enter・Spaceを連続入力し、編集対象の選択範囲も確認 |
| ブラウザの空・異常状態 | Empty / StateMachineOnly / Undefined / PartialSyntaxError / Cycles / LayoutFailureの各story。警告・部分図・復旧入口の表示と操作 |
| Tauri macOS / Windows | 新規・既存文書→図の閲覧→保存→閉じる→再度開く。本文に図の座標等が混ざらず参照が同じ、表示状態は初期化 |
| Tauri実ファイル監視 | 外部エディタで正常・破損・未定義の本文へ変更。未保存編集との競合の採用/保持、IME中の遅延、読み込み失敗後の復旧 |
| Tauriのマウス・トラックパッド | 4pxのパン閾値、ホイール/2本指パン、Ctrl/⌘付きwheel/ピンチ、ズーム後の選択と参照移動 |
| 表示性能 | 上記の20回測定。CPU測定値で代用しない |

表示確認の取得例（`pnpm dev` / `pnpm storybook`起動後）:

```bash
playwright-cli open http://localhost:14000
playwright-cli resize 1280 720
playwright-cli screenshot --filename=dependency-desktop.png
playwright-cli goto 'http://localhost:6006/iframe.html?id=model-dependencyview--long-content&globals=theme:dark'
playwright-cli resize 640 720
playwright-cli screenshot --filename=dependency-narrow-dark.png
```

これは再実行用の例であり、本環境で取得に成功したコマンドではない。定義編集への移動やテーマ切替はStorybook上だけでなくアプリでも確認する。
