#!/usr/bin/env bash
set -euo pipefail

# CARET: rebuild CLI (protos + Go) and run caret with provided args (default: version)
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
# Prefer Node 20 if available (avoid system node mismatch)
if [ -d "$HOME/.config/nvm/versions/node/v20.19.5/bin" ]; then
	export PATH="$HOME/.config/nvm/versions/node/v20.19.5/bin:$PATH"
fi
export PATH="$HOME/go/bin:$PATH"
export GOCACHE="${ROOT}/.cache/go-build"

pushd "$ROOT" >/dev/null
npm run protos
npm run protos-go
# CARET MODIFICATION: Node 버전 불일치로 인한 better-sqlite3 로딩 실패 방지
npm rebuild better-sqlite3
bash scripts/build-cli.sh
# CARET MODIFICATION: standalone 빌드 산출물(cline-core.js) 포함
npm run compile-standalone
npm run postcompile-standalone
export PATH="${ROOT}/dist-standalone/bin:$PATH"

if [ "$#" -eq 0 ]; then
  set -- version
fi

exec "${ROOT}/dist-standalone/bin/caret" "$@"
