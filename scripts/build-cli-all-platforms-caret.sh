#!/usr/bin/env bash
# // CARET MODIFICATION: Linux/macOS build script for Caret CLI (all platforms).
set -eu

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

(cd "${ROOT_DIR}" && npm run protos)
(cd "${ROOT_DIR}" && npm run protos-go)
mkdir -p "${ROOT_DIR}/dist-standalone/extension"
cp "${ROOT_DIR}/package.json" "${ROOT_DIR}/dist-standalone/extension/package.json"

CORE_VERSION=$(node -p "require('${ROOT_DIR}/package.json').version")
CLI_VERSION=$(node -p "require('${ROOT_DIR}/cli/package.json').version")
COMMIT=$(git -C "${ROOT_DIR}" rev-parse --short HEAD 2>/dev/null || echo "unknown")
DATE=$(date -u '+%Y-%m-%dT%H:%M:%SZ')
BUILT_BY="${USER:-unknown}"

LDFLAGS="-X 'github.com/cline/cli/pkg/cli/global.Version=${CORE_VERSION}' \
         -X 'github.com/cline/cli/pkg/cli/global.CliVersion=${CLI_VERSION}' \
         -X 'github.com/cline/cli/pkg/cli/global.Commit=${COMMIT}' \
         -X 'github.com/cline/cli/pkg/cli/global.Date=${DATE}' \
         -X 'github.com/cline/cli/pkg/cli/global.BuiltBy=${BUILT_BY}'"

PLATFORMS=(
  "darwin/arm64"
  "darwin/amd64"
  "linux/amd64"
  "linux/arm64"
  "windows/amd64"
)

mkdir -p "${ROOT_DIR}/cli/bin"

pushd "${ROOT_DIR}/cli" >/dev/null
export GO111MODULE=on
export CGO_ENABLED=0

for platform in "${PLATFORMS[@]}"; do
  GOOS=${platform%/*}
  GOARCH=${platform#*/}

  echo "Building for $GOOS/$GOARCH..."

  EXT=""
  if [ "$GOOS" = "windows" ]; then
    EXT=".exe"
  fi

  OUTPUT_NAME="bin/caret-${GOOS}-${GOARCH}${EXT}"
  GOOS=$GOOS GOARCH=$GOARCH go build -ldflags "$LDFLAGS" -o "$OUTPUT_NAME" ./cmd/cline

  OUTPUT_NAME="bin/caret-host-${GOOS}-${GOARCH}${EXT}"
  GOOS=$GOOS GOARCH=$GOARCH go build -ldflags "$LDFLAGS" -o "$OUTPUT_NAME" ./cmd/cline-host
done
popd >/dev/null

mkdir -p "${ROOT_DIR}/dist-standalone/bin"
rm -f "${ROOT_DIR}/dist-standalone/bin/cline"* "${ROOT_DIR}/dist-standalone/bin/caret"* || true

cp "${ROOT_DIR}/cli/bin/caret-"* "${ROOT_DIR}/dist-standalone/bin/"
cp "${ROOT_DIR}/cli/bin/caret-host-"* "${ROOT_DIR}/dist-standalone/bin/"

# CARET MODIFICATION: keep cline aliases for legacy packaging scripts.
for file in "${ROOT_DIR}/cli/bin/caret-"*; do
  base=$(basename "$file")
  cp "$file" "${ROOT_DIR}/dist-standalone/bin/${base/caret-/cline-}"
done
for file in "${ROOT_DIR}/cli/bin/caret-host-"*; do
  base=$(basename "$file")
  cp "$file" "${ROOT_DIR}/dist-standalone/bin/${base/caret-host-/cline-host-}"
done

echo "Copied multi-platform binaries to dist-standalone/bin (Caret + Cline aliases)."
