#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
SUBMODULE="$REPO_ROOT/libs/omd2typst"
OUT="$REPO_ROOT/src/wasm/omd2typst-pkg"

cd "$SUBMODULE"
wasm-pack build crates/wasm --target bundler --out-dir "$OUT" --no-opt
# wasm-pack writes a catch-all .gitignore into the output dir. The package is
# committed on purpose: a clean checkout (CI, the community-store build check)
# must be able to run `npm run build` without a Rust toolchain.
rm -f "$OUT/.gitignore"
# Keep only what src/wasm/omd2typst.ts imports (the _bg.js glue + .wasm). The
# generated .d.ts files carry blanket `eslint-disable` headers that the
# community-store review rejects, and the entry glue / typings are unused.
rm -f "$OUT"/*.d.ts "$OUT/omd2typst_wasm.js" "$OUT/package.json"
echo "✓ omd2typst WASM written to $OUT"
