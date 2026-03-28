#!/bin/bash
# notify-review-after-pr.sh
# PostToolUse hook for Bash: notify to start code-reviewer after `gh pr create`.

# Check if the tool input contains a `gh pr create` command
if echo "$CLAUDE_TOOL_INPUT" | grep -q "gh pr create"; then
  echo ""
  echo "📋 PR が作成されました！"
  echo "   → code-reviewer エージェントでレビューを開始してください。"
  echo "   例: /review <PR番号>"
  echo ""
fi

exit 0
