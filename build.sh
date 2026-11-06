#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DIST_DIR="${ROOT_DIR}/dist"

mkdir -p "${DIST_DIR}"

echo "Packaging Chrome extension..."
(cd "${ROOT_DIR}/chrome" && zip -r -FS "${DIST_DIR}/salesforce-enhancer-chrome.zip" . -x "*.DS_Store*" -x "__MACOSX*")

echo "Packaging Firefox extension..."
(cd "${ROOT_DIR}/firefox" && zip -r -FS "${DIST_DIR}/salesforce-enhancer-firefox.zip" . -x "*.DS_Store*" -x "__MACOSX*")

echo "Build complete. Artifacts written to ${DIST_DIR}:"
ls -lh "${DIST_DIR}"
