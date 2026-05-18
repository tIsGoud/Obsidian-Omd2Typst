import {
  __wbg_set_wasm,
  __wbindgen_init_externref_table,
  render_to_typst,
  get_builtin_template,
} from './omd2typst-pkg/omd2typst_wasm_bg.js';

let initialised = false;
let wasmPath: string | null = null;

/**
 * Must be called once on plugin load before any omd2typst conversion.
 * resourcePath — the absolute resource path to omd2typst_bg.wasm
 * (from app.vault.adapter.getResourcePath(normalizePath(`${pluginDir}/wasm-runtime/omd2typst_bg.wasm`)))
 */
export function setOmd2TypstWasmPath(resourcePath: string): void {
  wasmPath = resourcePath;
}

async function ensureInit(): Promise<void> {
  if (initialised) return;
  if (!wasmPath)
    throw new Error(
      'omd2typst WASM path not configured. Call setOmd2TypstWasmPath() first.',
    );

  // Fetch and compile the WASM asynchronously (avoids 4 KB sync-compile limit
  // enforced by Chrome / Electron on the main thread).
  const response = await fetch(wasmPath);
  const buffer = await response.arrayBuffer();
  const { instance } = await WebAssembly.instantiate(buffer, {
    './omd2typst_wasm_bg.js': {
      __wbindgen_init_externref_table,
    },
  });

  // Wire the wasm instance exports into the bg glue module.
  __wbg_set_wasm(instance.exports);

  // Run wasm-bindgen start function (initialises the externref table, etc.).
  (instance.exports.__wbindgen_start as CallableFunction)();

  initialised = true;
}

/**
 * Convert Markdown to a Typst source string.
 * Pass the full content of a .typ template as templateSrc, or null for the built-in.
 */
export async function renderToTypst(
  markdown: string,
  templateSrc: string | null,
): Promise<string> {
  await ensureInit();
  return render_to_typst(markdown, templateSrc ?? undefined);
}

/** Return the built-in Typst template source. */
export async function getBuiltinTemplate(): Promise<string> {
  await ensureInit();
  return get_builtin_template();
}
