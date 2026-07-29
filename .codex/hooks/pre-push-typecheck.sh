#!/usr/bin/env bash
#
# push 前の型チェック: git push の実行前に TypeScript の型チェックを走らせ、
# 型エラーがあれば push をブロックする PreToolUse フック。
# 由来: d-market-typescript / typescript-rules-plugin の pre-push-typecheck.sh
#
# 適応: このリポジトリは tsconfig の project references を使うため、
#       package.json の typecheck スクリプト（tsc -b）を優先して実行する。
set -euo pipefail

# --- stdin から Bash コマンドを取得 ---
input="$(cat)"
command="$(jq -r '.tool_input.command // empty' <<< "$input")"

# git push 以外はスルー
if ! echo "$command" | grep -qE '(^|\s|[;&|])\s*git\s+push\b'; then
  exit 0
fi

# Claude Code は CLAUDE_PROJECT_DIR、Codex は未設定のため git root にフォールバック
project_root="${CLAUDE_PROJECT_DIR:-}"
if [ -z "$project_root" ]; then
  project_root="$(git rev-parse --show-toplevel 2>/dev/null || true)"
fi
project_root="${project_root:-$PWD}"
[ -f "$project_root/package.json" ] || exit 0

# 依存が未インストール（node_modules 無し）または tsc が実行不能な場合は黙ってスキップ
[ -d "$project_root/node_modules" ] || exit 0
if ! (cd "$project_root" && pnpm exec tsc --version >/dev/null 2>&1); then
  exit 0
fi

# --- 型チェック実行（typecheck スクリプト優先、無ければ tsc --noEmit） ---
if jq -e '.scripts.typecheck != null' "$project_root/package.json" >/dev/null 2>&1; then
  if result="$(cd "$project_root" && pnpm run typecheck 2>&1)"; then
    exit 0
  fi
else
  if result="$(cd "$project_root" && pnpm exec tsc --noEmit 2>&1)"; then
    exit 0
  fi
fi

# 型エラーあり → push をブロックし、エラー内容を AI にフィードバック
jq -Rn --arg msg "$result" '{
  hookSpecificOutput: {
    hookEventName: "PreToolUse",
    permissionDecision: "deny",
    permissionDecisionReason: ("型チェックでエラーが検出されたため push をブロックしました。以下の型エラーをすべて修正してから再度 push してください。\n\n" + $msg)
  }
}'
