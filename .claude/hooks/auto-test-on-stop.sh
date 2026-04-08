#!/bin/bash
# Stop hook: Run tests automatically when TypeScript files have been changed

CHANGED_TS=$(git diff --name-only 2>/dev/null | grep -E '\.(ts|tsx)$' | head -1)
STAGED_TS=$(git diff --cached --name-only 2>/dev/null | grep -E '\.(ts|tsx)$' | head -1)

if [ -n "$CHANGED_TS" ] || [ -n "$STAGED_TS" ]; then
  echo "🧪 TypeScript changes detected. Running tests..."
  npm run test:unit 2>&1 | tail -20
fi
