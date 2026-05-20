#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
SUBMODULE="$REPO_ROOT/libs/omd2typst"
OUT="$REPO_ROOT/src/wasm/omd2typst-pkg"

cd "$SUBMODULE"
wasm-pack build crates/wasm --target bundler --out-dir "$OUT" --no-opt
echo "✓ omd2typst WASM written to $OUT"
