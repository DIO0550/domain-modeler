# hooks — 実装規約の強制フック

Claude Code (`.claude/`) と Codex (`.codex/`) で `rules/` 配下の実装規約を**強制**するためのフックスクリプト置き場。
[d-market-typescript の typescript-rules-plugin](https://github.com/DIO0550/d-market) の hooks から、
このリポジトリの規約に合致するものを移植・適応したもの。

`.claude/hooks/` と `.codex/hooks/` は同じスクリプトを保持する。配線だけが各ランタイム向けに分かれる。

## 強制している規約

| スクリプト               | イベント                  | 内容                                                                                     |
| ------------------------ | ------------------------- | ---------------------------------------------------------------------------------------- |
| `block-npx.sh`           | `PreToolUse` (Bash)       | **npx / pnpm dlx 禁止**。パッケージは `pnpm add` でインストールしてから使用する           |
| `block-lint-suppress.sh` | `PreToolUse` (Edit/Write/apply_patch) | **lint 抑制コメント禁止**。`biome-ignore` / `eslint-disable` の追加を拒否する             |
| `post-edit-lint.sh`      | `PostToolUse` (Edit/Write/apply_patch) | **編集後の自動リント**。oxlint / Biome を `--fix` 付きで実行し、残った診断をフィードバック |
| `check-test-rules.sh`    | `PostToolUse` (Edit/Write/apply_patch) | **テスト規約検証**(rules/testing.md)。describe 禁止・条件分岐禁止・命名規則をチェック    |
| `pre-push-typecheck.sh`  | `PreToolUse` (Bash)       | **push 前の型チェック**。`pnpm run typecheck`(tsc -b)でエラーがあれば push をブロック    |
| `pre-push-lint.sh`       | `PreToolUse` (Bash)       | **push 前の全体 lint**。oxlint / Biome のエラーがあれば push をブロック                   |
| `pre-push-test-rules.sh` | `PreToolUse` (Bash)       | **push 前の全体テスト規約検査**。全 `*.test.ts(x)` を検査し違反があれば push をブロック   |

## 移植元から見送ったもの

- `check-jsdoc-rules.sh` / `pre-push-jsdoc.sh` — JSDoc 必須ルールはこのリポジトリの規約に存在しないため
- `require-skill-before-edit.sh` / `record-skill-fired.sh` — typescript-rules-plugin 固有のスキルに依存するスキルゲートのため

## 配線

- Claude Code: [`.claude/settings.json`](../../.claude/settings.json) の `hooks.PreToolUse` / `hooks.PostToolUse`
  - パスは `$CLAUDE_PROJECT_DIR` 基準
- Codex: [`.codex/hooks.json`](../hooks.json)（[`.codex/config.toml`](../config.toml) で `features.hooks = true`）
  - パスは `$(git rev-parse --show-toplevel)/.codex/hooks/...` 基準
  - ファイル編集は matcher `apply_patch|Edit|Write`（Codex の canonical tool は `apply_patch`）

## 例外(エスケープハッチ)

- `block-lint-suppress.sh` は以下を許可する:
  - `useExhaustiveDependencies` / `react-hooks/exhaustive-deps`(useEffect マウント時)
  - `noUnusedVariables` / `no-unused-vars`(ブランド型 `declare const ... unique symbol` の直前行のみ)
  - 対象ファイルに `// @lint-suppress-ok` を記載した場合(本当に必要なときのみ)
- テスト規約チェック(`check-test-rules.sh` / `pre-push-test-rules.sh`)は以下で個別に無効化できる:
  - ファイル単位: `// @test-rules-disable [no-describe|no-conditional|file-naming ...]`(引数なしで全ルール無効化)
  - プロジェクト単位: 最寄りの `.test-rules.yml` に `<ルール名>: false` を記載
- `pre-push-typecheck.sh` / `pre-push-lint.sh` は node_modules 未インストール時(ツールが実行不能な場合)は黙ってスキップする

## 動作確認

```bash
# 拒否されること(deny が出力される)
echo '{"tool_input":{"command":"npx create-vite"}}' | bash .codex/hooks/block-npx.sh

# 許可されること(出力なし・exit 0)
echo '{"tool_input":{"command":"pnpm run lint"}}' | bash .codex/hooks/block-npx.sh
```
