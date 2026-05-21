#!/bin/bash
set -euo pipefail

if [ $# -ne 1 ]; then
  echo "Usage: $0 <version>"
  echo "Example: $0 0.1.3"
  exit 1
fi

VERSION="$1"
TAG="conduit-v${VERSION}"

if ! [[ "$VERSION" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  echo "Error: version must be in format X.Y.Z"
  exit 1
fi

echo "Bumping Conduit to v${VERSION}..."

perl -pi -e 's/"version": "[^"]*"/"version": "'"${VERSION}"'"/' conduit/package.json
perl -pi -e 's/^(version = )"[^"]*"/$1"'"${VERSION}"'"/' conduit/src-tauri/Cargo.toml
perl -pi -e 's/"version": "[^"]*"/"version": "'"${VERSION}"'"/' conduit/src-tauri/tauri.conf.json

echo "Formatting files..."
pnpm exec vp fmt conduit/src-tauri/tauri.conf.json

echo "Updating Cargo.lock..."
cd conduit/src-tauri && cargo update -w && cd ../..

git add conduit/package.json conduit/src-tauri/Cargo.toml conduit/src-tauri/Cargo.lock conduit/src-tauri/tauri.conf.json
git commit -m "chore(conduit): bump version to ${VERSION}"
git tag -m "Conduit v${VERSION}" "${TAG}"
git push origin main
git push origin "${TAG}"

echo ""
echo "Release ${TAG} pushed!"
echo "Monitor at: https://github.com/JosueGalRe/shoma/actions"
echo "Release will appear at: https://github.com/JosueGalRe/shoma/releases/tag/${TAG}"
