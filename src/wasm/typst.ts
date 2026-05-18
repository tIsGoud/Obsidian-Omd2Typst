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

// Node.js modules — available in Electron (Obsidian's runtime).
// Use require() so esbuild doesn't try to bundle them as ESM.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const nodeFs   = typeof require !== 'undefined' ? require('fs')   as typeof import('fs')   : null;
// eslint-disable-next-line @typescript-eslint/no-require-imports
const nodePath = typeof require !== 'undefined' ? require('path') as typeof import('path') : null;
// eslint-disable-next-line @typescript-eslint/no-require-imports
const nodeOs   = typeof require !== 'undefined' ? require('os')   as typeof import('os')   : null;

/** Platform-specific directories to scan for .ttf / .otf font files. */
function systemFontDirs(): string[] {
  if (!nodeOs || !nodePath) return [];
  const home = nodeOs.homedir();
  const platform = nodeOs.platform();
  if (platform === 'darwin') {
    return [
      nodePath.join(home, 'Library/Fonts'),
      '/Library/Fonts',
      '/System/Library/Fonts/Supplemental', // .ttf/.otf on macOS 11+
    ];
  } else if (platform === 'win32') {
    const windir = (typeof process !== 'undefined' && process.env.WINDIR) || 'C:\\Windows';
    return [nodePath.join(windir, 'Fonts')];
  }
  return [
    nodePath.join(home, '.fonts'),
    nodePath.join(home, '.local/share/fonts'),
    '/usr/share/fonts/truetype',
    '/usr/share/fonts/opentype',
    '/usr/local/share/fonts',
  ];
}

/**
 * Load system fonts into the compiler builder via Node.js fs.
 * This is the reliable fallback when document.fonts yields nothing usable.
 * Limited to MAX files to keep init time reasonable.
 */
async function loadSystemFonts(builder: TypstCompilerBuilder): Promise<number> {
  if (!nodeFs || !nodePath) return 0;
  const MAX = 100;
  let loaded = 0;

  outer: for (const dir of systemFontDirs()) {
    let files: string[];
    try { files = nodeFs.readdirSync(dir) as string[]; } catch { continue; }
    for (const file of files) {
      if (loaded >= MAX) break outer;
      if (!/\.(ttf|otf)$/i.test(file)) continue;
      try {
        const buf = nodeFs.readFileSync(nodePath.join(dir, file)) as Buffer;
        await builder.add_raw_font(new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength));
        loaded++;
      } catch { /* unreadable or unsupported — skip */ }
    }
  }
  return loaded;
}

async function ensureCompiler(): Promise<TypstCompiler> {
  if (compiler) return compiler;
  if (!wasmUrl) throw new Error('Typst WASM path not configured. Call setTypstWasmPath() first.');

  // Initialise the underlying WASM binary.
  // Pass as object { module_or_path } — bare string triggers a deprecation warning.
  await wasmInit({ module_or_path: wasmUrl });

  const builder = new TypstCompilerBuilder();

  // ── Font loading (two-stage) ─────────────────────────────────────────────
  // Stage 1: web fonts from document.fonts (Obsidian/Electron CSS fonts).
  // Filter out FontFace entries with empty family — typst-ts throws on them.
  let webFontsLoaded = 0;
  if (typeof document !== 'undefined' && document.fonts) {
    try {
      await document.fonts.ready;
      const all = Array.from(document.fonts);
      const valid = all.filter(f => f.family.trim() !== '');
      console.log(`[omd2typst] document.fonts: ${all.length} total, ${valid.length} with non-empty family`);
      if (valid.length > 0) {
        await builder.add_web_fonts(valid);
        webFontsLoaded = valid.length;
      }
    } catch (e) {
      console.error('[omd2typst] add_web_fonts failed:', e);
    }
  }

  // Stage 2: system fonts via Node.js fs (Electron).
  // Only run if web fonts yielded nothing — system fonts are slower to load.
  if (webFontsLoaded === 0) {
    console.log('[omd2typst] No web fonts available; loading system fonts via fs...');
    const n = await loadSystemFonts(builder);
    console.log(`[omd2typst] Loaded ${n} system fonts`);
  }
  // ─────────────────────────────────────────────────────────────────────────

  if (vaultApp) {
    const app = vaultApp;
    // The vault's absolute filesystem path (e.g. /Users/alice/MyVault).
    // This is used by real_path_fn so the Typst compiler's project-root check
    // accepts vault-relative paths like /typst/template.typ.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const vaultBase: string = (app.vault.adapter as any).basePath ?? '';

    await builder.set_access_model(
      null satisfies Ctx,
      // mtime_fn: return a fixed timestamp — we don't track modification times
      (_ctx: Ctx, _path: string) => BigInt(Date.now()),
      // is_file_fn: assume every queried path is a file
      (_ctx: Ctx, _path: string) => true,
      // real_path_fn: map virtual vault-relative paths to real OS paths.
      // Virtual /foo → <vaultRoot>/foo.  The Typst compiler uses the real path
      // to enforce its project-root restriction, so everything inside the vault
      // must resolve to a path underneath the vault root.
      (_ctx: Ctx, path: string) => {
        if (!nodePath || !vaultBase) return path;
        const rel = path.startsWith('/') ? path.slice(1) : path;
        return nodePath.join(vaultBase, rel);
      },
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

  console.log('[omd2typst] Building Typst compiler...');
  compiler = await builder.build();
  console.log('[omd2typst] Typst compiler built successfully');

  const loadedFonts = compiler.get_loaded_fonts();
  console.log(`[omd2typst] Typst compiler loaded fonts (${loadedFonts.length}):`, loadedFonts.slice(0, 10));

  return compiler;
}

/**
 * Compile a Typst source string to PDF bytes.
 * extraSources — optional virtual-path→content map of files to pre-load into
 * the compiler's in-memory VFS before compiling (e.g. template .typ files).
 * Pre-loading bypasses the access-model project-root restriction.
 */
export async function compileToPdf(
  typstSrc: string,
  extraSources: Map<string, string> = new Map(),
): Promise<Uint8Array> {
  console.log('[omd2typst] compileToPdf: initialising compiler...');
  const c = await ensureCompiler();
  console.log('[omd2typst] compileToPdf: compiler ready, compiling...');

  // Reset shadow state from any previous compilation, then add sources.
  c.reset_shadow();
  c.add_source('/main.typ', typstSrc);
  for (const [path, content] of extraSources) {
    c.add_source(path, content);
    console.log(`[omd2typst] Pre-loaded extra source: ${path}`);
  }

  // compile() returns an opaque JS object; the PDF bytes live in `.result`.
  // diagnosticsFormat 0 = plain text diagnostics (not used here).
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let output: any;
  try {
    output = c.compile('/main.typ', undefined, 'pdf', 0);
  } catch (e) {
    console.error('[omd2typst] compileToPdf: compile() threw:', e);
    throw e;
  }

  // Log the raw output so we can see its shape during debugging.
  console.log('[omd2typst] compile() raw output:', output);

  if (!output) {
    console.error('[omd2typst] compileToPdf: compiler returned no output');
    throw new Error('Typst compilation returned no output.');
  }

  // Log any diagnostics so we can see font warnings, errors, etc.
  if (output.diagnostics?.length) {
    console.warn('[omd2typst] Typst diagnostics:', output.diagnostics);
  }

  // The result property is the raw PDF bytes.
  const pdf: Uint8Array | undefined = output.result ?? output;
  if (!pdf || !(pdf instanceof Uint8Array)) {
    console.error('[omd2typst] compileToPdf: unexpected output shape:', output);
    throw new Error(`Typst compilation failed: ${JSON.stringify(output)}`);
  }
  console.log(`[omd2typst] compileToPdf: success, ${pdf.byteLength} bytes`);
  return pdf;
}

// ── CLI fallback ─────────────────────────────────────────────────────────────

/** Return the absolute path of the typst binary, or null if not found. */
function findTypstBinary(): string | null {
  if (!nodeFs) return null;
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const cp = require('child_process') as typeof import('child_process');
  // Try 'typst' via PATH first (works when Obsidian inherits a shell PATH).
  try { cp.execSync('typst --version', { stdio: 'pipe' }); return 'typst'; } catch { /* fall through */ }
  // Common fixed locations when PATH is minimal (e.g. launched from macOS Dock).
  const candidates = [
    '/opt/homebrew/bin/typst',   // macOS ARM Homebrew
    '/usr/local/bin/typst',       // macOS Intel Homebrew / manual install
    '/usr/bin/typst',             // Linux distro package
    process.env.HOME ? `${process.env.HOME}/.cargo/bin/typst` : '',
  ];
  for (const p of candidates) {
    if (p && nodeFs.existsSync(p)) return p;
  }
  return null;
}

/**
 * Compile a .typ file on disk to PDF using the system typst CLI.
 * typPath   — vault-relative path to the .typ file (e.g. "exports/hello.typ")
 * vaultBase — absolute vault root on the filesystem
 */
export async function compileToPdfViaCli(typPath: string, vaultBase: string): Promise<Uint8Array> {
  if (!nodeFs || !nodePath) throw new Error('CLI fallback requires Electron/Node environment');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const cp = require('child_process') as typeof import('child_process');

  const bin = findTypstBinary();
  if (!bin) throw new Error('typst CLI not found. Install it from https://typst.app or add it to PATH.');

  const realTypPath = nodePath.join(vaultBase, typPath);
  // Write the PDF alongside the .typ file under a temp name, then we move the
  // bytes into the vault ourselves so Obsidian sees the change.
  const realPdfPath = realTypPath.replace(/\.typ$/, '.__tmp.pdf');

  const cmd = [
    `"${bin}"`,
    'compile',
    `"${realTypPath}"`,
    `"${realPdfPath}"`,
    `--root "${vaultBase}"`,
  ].join(' ');

  console.log('[omd2typst] CLI compile:', cmd);
  try {
    cp.execSync(cmd, { timeout: 120_000, stdio: 'pipe' });
    const buf = nodeFs.readFileSync(realPdfPath) as Buffer;
    return new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength);
  } finally {
    try { nodeFs.unlinkSync(realPdfPath); } catch { /* best-effort cleanup */ }
  }
}
