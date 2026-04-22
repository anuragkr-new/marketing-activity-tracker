#!/usr/bin/env bash
# Run in Terminal.app (not the Cursor agent) so git can write .git under Documents.
set -euo pipefail
cd "$(dirname "$0")/.."

REPO_NAME="marketing-activities-tracker"

if [[ ! -d .git ]]; then
  git init
  git branch -M main
fi

git add -A
if git diff --staged --quiet; then
  echo "Nothing to commit."
else
  git commit -m "Initial commit: marketing activity tracker" || true
fi

if command -v gh >/dev/null 2>&1; then
  if git remote get-url origin >/dev/null 2>&1; then
    echo "Remote origin exists. Pushing..."
    git push -u origin main
  else
    gh repo create "${REPO_NAME}" --public --source=. --remote=origin --push
  fi
else
  echo "Install GitHub CLI: brew install gh && gh auth login"
  echo "Or create https://github.com/new?name=${REPO_NAME} then:"
  echo "  git remote add origin https://github.com/YOUR_USER/${REPO_NAME}.git"
  echo "  git push -u origin main"
  exit 1
fi

echo "Done. Remote:"
git remote -v
