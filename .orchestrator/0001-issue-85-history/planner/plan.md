# 実装計画

**関連Issue**: #85（016. [Feature][CanvasCore] undo/redo 履歴を実装）

## タスク

`canvas-core` に、仕様どおりの **snapshot 方式** undo/redo 履歴を実装する。上限100、transaction begin/commit、redo 破棄、viewport/選択を履歴対象外にする設計をテストで固定する。

## 目的

- 仕様（`docs/domain-modeler/canvas-core.md` §9、`index.md` の設計判断「undo方式 = スナップショット」）に揃える
- ドラッグ・リサイズ・本文編集セッションを1履歴エントリにまとめられる API を提供する（`canvas-ui.md` §4）
- 後続 Issue #86（外部変更取り込み）が「履歴付き置換」を積める土台にする

## 現状分析（調査結果）

### 仕様（根拠あり）

| 項目 | 根拠 | 内容 |
|------|------|------|
| 方式 | `canvas-core.md` §9 / `index.md` §4 | **スナップショット**。操作後ドキュメント全体を積む。逆コマンド不要 |
| 上限 | `canvas-core.md` §9 | **100**。超過は古い順に破棄 |
| トランザクション | `canvas-core.md` §9 / `canvas-ui.md` §4 | ドラッグ・リサイズは開始〜確定で1エントリ。本文編集はフォーカスイン〜アウトで1エントリ |
| 対象外 | `canvas-core.md` §5, §9 | **viewport 変更・選択状態は履歴対象外** |
| 派生状態 | `canvas-core.md` §9 | undo/redo 後の接続警告などは再計算 |
| 外部取り込み | `canvas-core.md` §10 | 通常の履歴エントリとして積む（#86） |

### Issue #85 記載パスについて

Issue / Epic は変更対象を `packages/canvas-core/src/history.ts` と記載しているが、これは欠落している `issues-breakdown.md` 由来の初期想定パス。

**現行の正しい配置**（既存実装・`rules/architecture.md` / `rules/testing.md`）:

```
packages/canvas-core/src/domain/history/
  index.ts
  __tests__/history.normal.test.ts
  command-stack/index.ts          # 現状（コマンド方式）
  document-command/index.ts       # 現状（コマンド方式）
```

→ 実装は **現行の `domain/history/` モジュール構造を維持**する。Issue 記載のフラットパスへ戻さない。

### 既存実装とのギャップ（重要）

PR #153 で History は既に存在するが、**仕様と不一致**:

| | 仕様 / Issue #85 | 現行（main） |
|--|------------------|--------------|
| 方式 | snapshot | **コマンド直和 + inverse**（`DocumentCommand`） |
| 記録API | record / begin・commit | `History.execute(history, command)` |
| トランザクション | begin/commit | **未実装**（呼び出し側が1コマンドにまとめるしかない） |
| 上限100 / redo破棄 | 要 | `CommandStack.push` の `HISTORY_LIMIT = 100` と `execute` 時の redo 空で充足 |
| viewport/選択除外テスト | 完了条件 | **未カバー** |

なお PR #153 の**最初のコミット**（`aa91f4e`）は仕様に近い snapshot 実装だった:

- `DocumentOperation { previous: Document; next: Document }`
- `History.create` / `History.record` / `History.undo` / `History.redo`
- `HISTORY_LIMIT = 100`、record 時に redo 破棄
- テスト「連続操作の確定結果だけを記録すると1回で操作前へ戻せる」（明示 begin/commit API は無し）

その後コマンド方式へリファクタされ、Issue #85 は **OPEN のまま**残っている。

### 選択状態について

- `Document`（`packages/canvas-core/src/domain/document.ts`）に選択フィールドは無い
- 選択は `canvas-ui.md` の UI 状態。core の History が Document のみ扱うこと自体が「選択を対象外にする設計」
- viewport は `Document.viewport` に含まれるため、**undo/redo 時に現在の viewport を保持する**明示設計が必要（下記）

## 仕様から読み取った API・振る舞い

### 推奨公開API（根拠付き）

関数・型名は **仕様に関数名が無い**ため、次を優先順位で採用する:

1. PR #153 初版（`aa91f4e`）で実績のある名前
2. Issue #85 本文の語（transaction **begin/commit**）
3. 既存 companion / Option パターン

```typescript
/** 1回の確定編集を表すスナップショット対（aa91f4e 由来） */
export interface DocumentOperation {
  readonly previous: Document;
  readonly next: Document;
}

export const DocumentOperation = {
  create: (documents: { readonly previous: Document; readonly next: Document }) => DocumentOperation
  undo: (operation: DocumentOperation) => Document  // → previous（viewport は呼び出し側/History が保持）
  redo: (operation: DocumentOperation) => Document  // → next
} as const

/**
 * 履歴状態は直和で表現する（coding 規約: boolean 組み合わせで不正状態を作らない）
 * - idle: 通常
 * - transaction: begin 済み・未 commit（baseline と current を保持）
 */
export type History = IdleHistory | TransactionHistory

export const History = {
  create: (document: Document) => History
  /** 単発確定（削除・種別変更・外部取り込み等）。redo 破棄。上限超過で古い操作破棄 */
  record: (history: IdleHistory, document: Document) => IdleHistory
  /** 連続操作の開始。baseline = 現在文書 */
  begin: (history: IdleHistory) => TransactionHistory  // 失敗は Result でも可（二重 begin 等）
  /**
   * トランザクション中の中間文書更新（スタックには積まない）。
   * 仕様に名前無し → 実装名は `replace` を推奨（current だけ差し替え）。
   * UI が中間状態を History 外で持つなら省略可（その場合 commit が最終 Document を受け取る）。
   */
  replace: (history: TransactionHistory, document: Document) => TransactionHistory
  /** 確定。baseline→current を1 DocumentOperation として積む。変化なしなら積まない判断も可 */
  commit: (history: TransactionHistory) => IdleHistory
  undo: (history: IdleHistory) => Option<IdleHistory>
  redo: (history: IdleHistory) => Option<IdleHistory>
}
```

**定数**: 既存どおり `HISTORY_LIMIT = 100`（`command-stack/index.ts` および `aa91f4e` と同値。仕様 §9）。

### 振る舞い詳細

1. **snapshot 記録**  
   `record(h, next)` → `undoStack` に `{ previous: h.current, next }` を追加し `current = next`、`redoStack = []`。`undoStack` は `.slice(-100)`。

2. **undo / redo**  
   - undo: 末尾 operation の `previous` を current に。operation を redo へ。空なら `Option.none()`  
   - redo: 末尾 operation の `next` を current に。operation を undo へ。空なら `Option.none()`  
   - **viewport 保持**: restore 時は  
     `{ ...restoredDocument, viewport: history.current.viewport }`  
     （Document 全体スナップショットでも viewport 変更の「効果」を undo しない）

3. **transaction begin/commit**  
   - `begin`: baseline を固定  
   - 中間の `replace`（または UI 側ドラフト）はスタックに積まない  
   - `commit`: 1 operation のみ追加 + redo 破棄  
   - トランザクション中の `undo`/`redo`/`record` は不正 → `Result.err` または型で防止（直和なら idle 専用メソッドに寄せる）

4. **redo 破棄**  
   `record` / `commit` 成功時に `redoStack` を空にする（現行・初版とも同挙動）

5. **viewport / 選択を対象外**  
   - viewport: 上記 restore 時保持 + 「viewport だけ変えても `record` しない」は呼び出し規約。テストで undo 後 viewport 不変を固定  
   - 選択: History/Document に選択を持たない。テストで Document 形状に選択が無いこと、または History API が Document のみ扱うことを仕様文で固定

## 変更概要

コマンド方式（`document-command` / `command-stack` / `History.execute`）を廃止し、snapshot 方式（`DocumentOperation` + `History.record` + `begin`/`commit`）へ置き換える。テストを仕様・完了条件に合わせて書き直す。

## 変更対象ファイル

| ファイル | 変更種別 | 変更内容 |
|---------|---------|---------|
| `packages/canvas-core/src/domain/history/index.ts` | 編集 | snapshot 版 `History` / `DocumentOperation` に置換。begin/commit/record/undo/redo |
| `packages/canvas-core/src/domain/history/__tests__/history.normal.test.ts` | 編集 | コマンド前提テストを snapshot 振る舞いに書き換え |
| `packages/canvas-core/src/domain/history/__tests__/history.transaction.test.ts` | 新規 | begin/commit・中間更新が1エントリになること |
| `packages/canvas-core/src/domain/history/__tests__/history.viewport.test.ts` | 新規 | viewport 非復元・選択非対象の完了条件 |
| `packages/canvas-core/src/domain/history/command-stack/` | 削除 | コマンドスタック不要 |
| `packages/canvas-core/src/domain/history/document-command/` | 削除 | 逆コマンド不要（仕様 §9） |
| `packages/canvas-core/src/index.ts` | 編集（必要時） | 削除モジュールの再 export が残らないことの確認。`export * from "./domain/history"` は維持 |

`Document` 本体・`Viewport` の変更は本 Issue スコープ外（viewport 更新用 `Document` API は現状未存在。UI が `{ ...doc, viewport: Viewport.pan(...) }` する想定）。

## タスク一覧と依存関係

| ID | タスク | blockedBy | 変更対象ファイル |
|----|-------|-----------|----------------|
| 1 | snapshot 基本APIのテスト固定 | - | `history.normal.test.ts` |
| 2 | viewport/選択の完了条件テスト | 1 | `history.viewport.test.ts` |
| 3 | begin/commit トランザクションテスト | 1 | `history.transaction.test.ts` |
| 4 | snapshot History 実装 + コマンド系削除 | 1, 2, 3 | `history/index.ts`, `command-stack/`, `document-command/` |
| 5 | export 確認とテスト実行 | 4 | `index.ts`, テスト一式 |

## 実装ステップ（TDD想定）

### Step 1: 基本振る舞いの Red（タスクID: 1）

`history.normal.test.ts` を **コマンド語彙から切り離し**、仕様文のテスト名で書き直す（`rules/testing.md`: describe 禁止・フラット・振る舞いテスト）。

最低限のケース（初版 `aa91f4e` のテストをベースに復元）:

1. 確定した編集を記録すると直前の文書へ戻せる（`record` → `undo`）
2. 戻した後は編集後の文書へ進める（`redo`）
3. 複数編集は新しいものから順に取り消せる
4. 戻した後に新しく編集すると、戻す前の文書へは進めない（**redo 破棄**）
5. 履歴がない場合は undo/redo とも値なし（`Option.none`）
6. 履歴が100件を超えると最も古い編集から破棄する（`undoStack.length === 100`）

この時点では実装がコマンドのままなので Red。

### Step 2: 完了条件テストの Red（タスクID: 2, 3 — 並列可）

**viewport / 選択（完了条件）** — `history.viewport.test.ts`:

1. 文書内容を record したあと viewport だけ変え、undo しても **viewport は undo 前のまま**で、stickies/title 等は戻る  
2. undo 後に redo しても viewport は維持される  
3. History / Document の対象に選択状態が含まれない（例: `current` が `Document` であり、選択用プロパティが型・実行時オブジェクトに無いことを仕様としてコメント＋構造アサーション。選択は UI 責務である旨をテスト名に含める）

**transaction** — `history.transaction.test.ts`:

1. begin → 複数回の中間文書更新 → commit すると、undo 一回で begin 前の文書に戻る（1エントリ）  
2. commit は redo を破棄する  
3. begin せず commit / 二重 begin などの不正は Result または型で扱える（採用した API に合わせて1ケース）

### Step 3: Green — snapshot 実装（タスクID: 4）

1. `history/index.ts` を `aa91f4e` の `DocumentOperation` + `History.record/undo/redo` をベースに復元
2. `begin` / `replace`（または commit 引数で最終 Document）/ `commit` を追加
3. undo/redo の current 復元で **viewport を現在値からコピー**
4. `command-stack/`・`document-command/` を削除し、履歴モジュール内の export を整理
5. companion object + `as const`、失敗は `Result`、不在は `Option`（既存 `domain/option.ts` / `domain/result.ts`）

### Step 4: 公開面と検証（タスクID: 5）

```bash
pnpm --filter @domain-modeler/canvas-core exec vitest run src/domain/history
# またはリポジトリルート
pnpm run test:run -- packages/canvas-core/src/domain/history
pnpm run typecheck
pnpm run lint
```

`packages/canvas-core/src/index.ts` の `export * from "./domain/history"` 経由で `History` / `DocumentOperation` が公開されることを型チェックで確認。旧 `ChangeTitleCommand` 等への参照がリポジトリに残っていないこと（現状は history テスト内のみ）。

## テストケース案（完了条件を満たすもの）

| # | ファイル案 | テスト名（仕様文） | 検証内容 |
|---|-----------|-------------------|----------|
| V1 | `history.viewport.test.ts` | 文書を戻しても表示範囲は戻さない | record（title/stickies 変更）→ viewport 変更 → undo → title は旧・viewport は変更後 |
| V2 | 同上 | やり直しても表示範囲は維持する | V1 の続きで redo → 内容は新・viewport は維持 |
| V3 | 同上 | 履歴は文書のみを対象とし選択状態を持たない | `History.create` の current が Document フィールドのみ（version/title/viewport/stickies/connections）。選択ID等を持たない |
| T1 | `history.transaction.test.ts` | ドラッグ相当の連続更新は確定後に一度だけ戻せる | begin → replace×N → commit → undo 1回で begin 前 |
| T2 | 同上 | 連続操作を確定するとやり直し候補は消える | undo 後に別 commit/record → redo は none |
| N1–N6 | `history.normal.test.ts` | 上記 Step1 の6ケース | record/undo/redo/上限/空 |

## 注意点・リスク

### 設計判断（実装前確認が望ましい — AGENTS.md「設計判断の確認」）

現行 main のコマンド方式を **破壊的に置き換える**。History を import している本番コードは現状 `canvas-core` 内とテストのみだが、公開 API（`ChangeTitleCommand` / `History.execute` 等）は変わる。

選択肢:

| 案 | 内容 | 評価 |
|----|------|------|
| **A（推奨）** | 仕様どおり snapshot に戻し、begin/commit を追加。コマンド系削除 | Issue #85・仕様・初版実装と一致。逆コマンド保守が不要 |
| B | コマンド方式を残し begin/commit だけ足す | 仕様の「スナップショット」と矛盾。完了条件の解釈が歪む |
| C | コマンドと snapshot を並存 | 過剰。規約の「語彙混在禁止」に抵触しやすい |

→ **案 A で進める前提**で本計画を書いている。案 B/C にする場合は実装前に判断を仰ぐ。

### その他リスク

- **viewport が Document に含まれる**ため、素の `DocumentOperation.undo` だと表示位置も巻き戻る。History 層で必ず現在 viewport を載せる実装・テストが必須
- トランザクション中の外部取り込みは仕様上「呼び出し元が遅延」（§10）。History 側は open transaction 中の `record` を拒否できると #86 が安全
- `issues-breakdown.md` はリポジトリに存在しない（404）。パス・分解は Issue 本文と現行アーキテクチャ規約を正とする
- テスト規約: モック禁止、`describe` 禁止、カテゴリはファイル名で分割（`.normal` / `.transaction` / `.viewport`）
- 引数は最大3つ。`DocumentOperation.create` は初版どおりオブジェクト1引数
- 外部ランタイム依存追加は禁止

## プロジェクト制約（Implementer 必守）

- Result / Option を使い `throw` しない（テストの `Result.unwrap` のみ例外可）
- companion object パターン、イミュータブル更新
- ロジックは `History` / `DocumentOperation` に帰属。services やローカルヘルパーに逃がさない
- モジュールは `index.ts` + `__tests__/`。deep import 禁止
- パッケージマネージャは pnpm

## テスト計画

- 上記ユニットテストを Vitest で Red → Green
- 手動 UI 確認は Phase 5（Canvas UI）以降。本 Issue は headless の単体テストで完了条件を満たす
- 回帰: `packages/canvas-core` 既存の document / viewport / serialize テストが落ちないこと
