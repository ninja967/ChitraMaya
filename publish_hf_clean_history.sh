#!/usr/bin/env bash
set -euo pipefail

: "${HF_SPACE_REPO:?Set HF_SPACE_REPO, for example https://huggingface.co/spaces/<user>/<space>}"

SOURCE_DIR="${SOURCE_DIR:-chitramaya}"
COMMIT_MESSAGE="${COMMIT_MESSAGE:-Initial ChitraMaya Space release}"
TMP_DIR="$(mktemp -d)"

cleanup() {
  rm -rf "$TMP_DIR"
}
trap cleanup EXIT

if [ -d "$SOURCE_DIR/dashboard" ]; then
  (cd "$SOURCE_DIR/dashboard" && npm install && npm run build)
fi

cp -a "$SOURCE_DIR/hosting"/. "$TMP_DIR"/
mkdir -p "$TMP_DIR/public"
if [ -d "$SOURCE_DIR/dashboard/dist" ]; then
  cp -a "$SOURCE_DIR/dashboard/dist"/. "$TMP_DIR/public"/
else
  echo "dashboard/dist not found; publish will include hosting proxy only." >&2
fi

cd "$TMP_DIR"
rm -rf .git

git init -b main
git add .
git commit -m "$COMMIT_MESSAGE"
git remote add origin "$HF_SPACE_REPO"
git push --force origin main

