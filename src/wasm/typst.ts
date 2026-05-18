// API NOTE: The @myriaddreamin/typst-ts-web-compiler package does NOT export
// createTypstCompiler(). Instead it exports TypstCompilerBuilder (builder
// pattern) and a default WASM init function. The compiler is constructed via:
//   new TypstCompilerBuilder() → .build() → TypstCompiler
// Sources are added with add_source(path, content).
// PDF is produced via compile(mainFilePath, undefined, 'pdf', 0) which returns
// an opaque JS object; the PDF bytes are in the `.result` property.

import wasmInit, { TypstCompilerBuilder, TypstCompiler } from '@myriaddreamin/typst-ts-web-compiler';
import type { App } from 'obsidian';

let compiler: TypstCompiler | null = null;
let wasmUrl: string | null = null;
let vaultApp: App | null = null;

/**
 * Must be called once on plugin load before any PDF compilation.
 * resourcePath — the absolute resource path to the typst_ts_web_compiler_bg.wasm
 * app — the Obsidian App instance, used to read vault files (images, fonts, etc.)
 */
export function setTypstWasmPath(resourcePath: string, app: App): void {
  wasmUrl = resourcePath;
  vaultApp = app;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Ctx = any;

async function ensureCompiler(): Promise<TypstCompiler> {
  if (compiler) return compiler;
  if (!wasmUrl) throw new Error('Typst WASM path not configured. Call setTypstWasmPath() first.');

  // Initialise the underlying WASM binary.
  // Pass as object { module_or_path } — bare string triggers a deprecation warning.
  await wasmInit({ module_or_path: wasmUrl });

  const builder = new TypstCompilerBuilder();

  if (vaultApp) {
    const app = vaultApp;
    // Vault-backed access model so the compiler can read images and other
    // binary assets referenced in the Typst source.
    await builder.set_access_model(
      null satisfies Ctx,
      // mtime_fn: return a fixed timestamp — we don't track modification times
      (_ctx: Ctx, _path: string) => BigInt(Date.now()),
      // is_file_fn: assume every queried path is a file
      (_ctx: Ctx, _path: string) => true,
      // real_path_fn: return the path unchanged
      (_ctx: Ctx, path: string) => path,
      // read_all_fn: read from the Obsidian vault adapter
      async (_ctx: Ctx, path: string) => {
        try {
          // Paths in the Typst source are vault-relative (e.g. /images/foo.png).
          // Strip the leading slash so the vault adapter can locate them.
          const vaultPath = path.startsWith('/') ? path.slice(1) : path;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          return await (app.vault.adapter as any).readBinary(vaultPath);
        } catch {
          return null;
        }
      },
    );
  } else {
    builder.set_dummy_access_model();
  }

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
