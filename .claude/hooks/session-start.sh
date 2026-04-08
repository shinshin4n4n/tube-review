#!/bin/bash
# SessionStart hook: Inject branch and Issue info at session start

BRANCH=$(git branch --show-current 2>/dev/null)
if [ -z "$BRANCH" ]; then
  exit 0
fi

echo "📍 Branch: $BRANCH"

# Extract issue number from branch name (e.g., feat/something-123 -> 123)
ISSUE_NUM=$(echo "$BRANCH" | grep -oE '[0-9]+$')
if [ -n "$ISSUE_NUM" ]; then
  echo "🔗 Related Issue: #$ISSUE_NUM"
fi

# Show open issues assigned to current user
OPEN_ISSUES=$(gh issue list --assignee @me --state open --limit 5 --json number,title 2>/dev/null)
if [ -n "$OPEN_ISSUES" ] && [ "$OPEN_ISSUES" != "[]" ]; then
  echo "📋 Open Issues assigned to you:"
  echo "$OPEN_ISSUES" | node -e "
    const data = JSON.parse(require('fs').readFileSync('/dev/stdin','utf8'));
    data.forEach(i => console.log('  #' + i.number + ' ' + i.title));
  " 2>/dev/null
fi

# Show uncommitted changes summary
CHANGES=$(git status --porcelain 2>/dev/null | wc -l | tr -d ' ')
if [ "$CHANGES" -gt 0 ]; then
  echo "⚠️  Uncommitted changes: $CHANGES files"
fi
