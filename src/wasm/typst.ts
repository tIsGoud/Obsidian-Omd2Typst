// API NOTE: The @myriaddreamin/typst-ts-web-compiler package does NOT export
// createTypstCompiler(). Instead it exports TypstCompilerBuilder (builder
// pattern) and a default WASM init function. The compiler is constructed via:
//   new TypstCompilerBuilder() → .build() → TypstCompiler
// Sources are added with add_source(path, content).
// PDF is produced via compile(mainFilePath, undefined, 'pdf', 0) which returns
// an opaque JS object; the PDF bytes are in the `.result` property.

import wasmInit, { TypstCompilerBuilder, TypstCompiler } from '@myriaddreamin/typst-ts-web-compiler';

let compiler: TypstCompiler | null = null;
let wasmUrl: string | null = null;

/**
 * Must be called once on plugin load before any PDF compilation.
 * resourcePath — the absolute resource path to the typst_ts_web_compiler_bg.wasm
 * (from app.vault.adapter.getResourcePath(normalizePath(`${pluginDir}/wasm-runtime/typst_ts_web_compiler_bg.wasm`)))
 */
export function setTypstWasmPath(resourcePath: string): void {
  wasmUrl = resourcePath;
}

async function ensureCompiler(): Promise<TypstCompiler> {
  if (compiler) return compiler;
  if (!wasmUrl) throw new Error('Typst WASM path not configured. Call setTypstWasmPath() first.');

  // Initialise the underlying WASM binary.
  // Pass as object { module_or_path } — bare string triggers a deprecation warning.
  await wasmInit({ module_or_path: wasmUrl });

  // Build the compiler with a dummy access model (no file-system access needed
  // since we supply sources programmatically via add_source).
  const builder = new TypstCompilerBuilder();
  builder.set_dummy_access_model();
  compiler = await builder.build();
  return compiler;
}

/** Compile a Typst source string to PDF bytes. */
export async function compileToPdf(typstSrc: string): Promise<Uint8Array> {
  const c = await ensureCompiler();

  // Reset shadow state from any previous compilation, then add the new source.
  c.reset_shadow();
  c.add_source('/main.typ', typstSrc);

  // compile() returns an opaque JS object; the PDF bytes live in `.result`.
  // diagnosticsFormat 0 = plain text diagnostics (not used here).
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const output: any = c.compile('/main.typ', undefined, 'pdf', 0);

  if (!output) throw new Error('Typst compilation returned no output.');

  // The result property is the raw PDF bytes.
  const pdf: Uint8Array | undefined = output.result ?? output;
  if (!pdf || !(pdf instanceof Uint8Array)) {
    throw new Error(`Typst compilation failed: ${JSON.stringify(output)}`);
  }
  return pdf;
}
