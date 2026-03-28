#!/bin/bash
# check-diff-threshold.sh
# PostToolUse hook for Write|Edit: warn when uncommitted changes exceed thresholds.
# Thresholds: >5 files or >50 lines changed → exit 2 (warning)

MAX_FILES=5
MAX_LINES=50

# Guard: skip if no commits exist yet
if ! git rev-parse HEAD >/dev/null 2>&1; then
  exit 0
fi

# Count changed files (staged + unstaged + untracked)
tracked_files=$(git diff --name-only HEAD 2>/dev/null | wc -l)
untracked_files=$(git ls-files --others --exclude-standard 2>/dev/null | wc -l)
changed_files=$(( tracked_files + untracked_files ))

# Count changed lines (additions + deletions, tracked files only)
changed_lines=$(git diff --numstat HEAD 2>/dev/null | awk '{ add += $1; del += $2 } END { print add + del + 0 }')

if [ "$changed_files" -gt "$MAX_FILES" ] || [ "$changed_lines" -gt "$MAX_LINES" ]; then
  echo "⚠️ 未コミットの変更が閾値を超えています（${changed_files}ファイル / ${changed_lines}行）"
  echo "   閾値: ${MAX_FILES}ファイル / ${MAX_LINES}行"
  echo "   → 変更をコミットしてから続行してください。"
  exit 2
fi

exit 0
