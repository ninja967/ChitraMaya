#!/usr/bin/env bash
set -euo pipefail

: "${GITHUB_REPO_URL:?Set GITHUB_REPO_URL, for example https://github.com/<user>/<repo>.git}"

SOURCE_DIR="${SOURCE_DIR:-chitramaya}"
COMMIT_MESSAGE="${COMMIT_MESSAGE:-Initial ChitraMaya release}"
TMP_DIR="$(mktemp -d)"

cleanup() {
  rm -rf "$TMP_DIR"
}
trap cleanup EXIT

cp -a "$SOURCE_DIR"/. "$TMP_DIR"/
cd "$TMP_DIR"
rm -rf .git

git init -b main
git add .
git commit -m "$COMMIT_MESSAGE"
git remote add origin "$GITHUB_REPO_URL"
git push --force origin main

