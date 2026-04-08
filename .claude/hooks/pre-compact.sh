#!/bin/bash
# PreCompact hook: Save session state before context compaction

STATE_FILE="$CLAUDE_PROJECT_DIR/.claude/last-session-state.md"

BRANCH=$(git branch --show-current 2>/dev/null)
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
UNCOMMITTED=$(git diff --stat 2>/dev/null)
STAGED=$(git diff --cached --stat 2>/dev/null)
RECENT_COMMITS=$(git log --oneline -5 2>/dev/null)

cat > "$STATE_FILE" <<STATEEOF
# Last Session State

- **Saved at**: $TIMESTAMP
- **Branch**: $BRANCH

## Recent Commits

\`\`\`
$RECENT_COMMITS
\`\`\`

## Uncommitted Changes

\`\`\`
$UNCOMMITTED
\`\`\`

## Staged Changes

\`\`\`
$STAGED
\`\`\`
STATEEOF

echo "💾 Session state saved to .claude/last-session-state.md"
