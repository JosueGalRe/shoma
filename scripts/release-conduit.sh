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

sed -i "s/\"version\": \".*\"/\"version\": \"${VERSION}\"/" conduit/package.json
sed -i '0,/^version = /s/version = ".*"/version = "'${VERSION}'"/' conduit/src-tauri/Cargo.toml
sed -i "s/\"version\": \".*\"/\"version\": \"${VERSION}\"/" conduit/src-tauri/tauri.conf.json

git add conduit/package.json conduit/src-tauri/Cargo.toml conduit/src-tauri/tauri.conf.json
git commit -m "chore(conduit): bump version to ${VERSION}"
git tag -m "Conduit v${VERSION}" "${TAG}"
git push origin main
git push origin "${TAG}"

echo ""
echo "Release ${TAG} pushed!"
echo "Monitor at: https://github.com/JosueGalRe/shoma/actions"
echo "Release will appear at: https://github.com/JosueGalRe/shoma/releases/tag/${TAG}"
