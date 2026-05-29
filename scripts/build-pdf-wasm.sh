#!/usr/bin/env bash
# Build the Typst PDF compiler WASM artifact.
# Output:
#   src/wasm/omd2typst-pdf-pkg/  — JS glue committed to this repo
#   /tmp/omd2typst-pdf-pkg/omd2typst_pdf_wasm_bg.wasm  — release artifact (~28 MB)
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
SUBMODULE="$REPO_ROOT/libs/omd2typst"
PKG_OUT="/tmp/omd2typst-pdf-pkg"
GLUE_DEST="$REPO_ROOT/src/wasm/omd2typst-pdf-pkg"

cd "$SUBMODULE"
wasm-pack build crates/pdf-wasm --target bundler --out-dir "$PKG_OUT" --no-opt

# Copy JS glue into the plugin source (these are committed — the WASM binary is not).
mkdir -p "$GLUE_DEST"
cp "$PKG_OUT/omd2typst_pdf_wasm_bg.js" \
   "$PKG_OUT/omd2typst_pdf_wasm_bg.wasm.d.ts" \
   "$PKG_OUT/omd2typst_pdf_wasm.d.ts" \
   "$PKG_OUT/omd2typst_pdf_wasm.js" \
   "$PKG_OUT/package.json" \
   "$GLUE_DEST/"

echo "✓ JS glue written to $GLUE_DEST"
echo "✓ WASM binary at $PKG_OUT/omd2typst_pdf_wasm_bg.wasm ($(du -sh "$PKG_OUT/omd2typst_pdf_wasm_bg.wasm" | cut -f1))"
echo "  → Publish this as release artifact: omd2typst-pdf-compiler.wasm"
