#!/usr/bin/env bash
#
# push 前のモジュール境界検査: リモートへの反映前に
# scripts/check-module-boundaries.mjs を走らせ、違反があれば push をブロックする
# PreToolUse フック。検査内容は rules/architecture.md「依存方向のルール」と
# rules/consistency.md「feature 間の参照は禁止する」。
set -euo pipefail

# --- stdin から Bash コマンドを取得 ---
input="$(cat)"
command="$(jq -r '.tool_input.command // empty' <<< "$input")"

# 対象コマンド以外はスルー
if ! echo "$command" | grep -qE '(^|\s|[;&|])\s*git\s+push\b'; then
  exit 0
fi

# Claude Code は CLAUDE_PROJECT_DIR、Codex は未設定のため git root にフォールバック
project_root="${CLAUDE_PROJECT_DIR:-}"
if [ -z "$project_root" ]; then
  project_root="$(git rev-parse --show-toplevel 2>/dev/null || true)"
fi
project_root="${project_root:-$PWD}"

checker="$project_root/scripts/check-module-boundaries.mjs"
[ -f "$checker" ] || exit 0

if ! result="$(node "$checker" 2>&1)"; then
  jq -Rn --arg msg "$result" '{
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      permissionDecision: "deny",
      permissionDecisionReason: ("push 前のモジュール境界検査で違反が検出されたため中断しました。rules/architecture.md と rules/consistency.md に従って修正してから再実行してください。\n\n" + $msg)
    }
  }'
fi
