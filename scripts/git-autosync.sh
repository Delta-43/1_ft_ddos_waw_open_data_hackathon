#!/usr/bin/env bash
# Keep a checkout up to date without touching uncommitted work.
# - Always fetches and prunes origin.
# - Fast-forwards local main. If main is checked out, it is only updated when the tree is clean.
# - Never merges, rebases or resets a feature branch.
set -u
repo="${1:?usage: git-autosync <repo-path>}"
cd "$repo" || exit 1
ts() { date '+%Y-%m-%d %H:%M:%S%z'; }
git fetch --prune --quiet origin || { echo "$(ts) fetch failed"; exit 1; }
branch=$(git symbolic-ref --quiet --short HEAD || echo "")
if [ "$branch" = "main" ]; then
  if [ -n "$(git status --porcelain --untracked-files=no)" ]; then
    echo "$(ts) on main with local changes; fetched only"; exit 0
  fi
  git merge --ff-only --quiet origin/main && echo "$(ts) main at $(git rev-parse --short HEAD)" \
    || echo "$(ts) main has diverged from origin/main; not updated"
else
  # Update the main ref without changing the working tree (fast-forward only).
  git fetch --quiet origin main:main 2>/dev/null \
    && echo "$(ts) on $branch; main at $(git rev-parse --short main)" \
    || echo "$(ts) on $branch; local main not fast-forwardable; fetched only"
fi
