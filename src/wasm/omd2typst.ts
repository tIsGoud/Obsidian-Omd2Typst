import {
  __wbg_set_wasm as _setWasm,
  render_to_typst as _renderToTypst,
  get_builtin_template as _getBuiltinTemplate,
} from './omd2typst-pkg/omd2typst_wasm_bg.js';
// @ts-ignore — esbuild binary loader provides this as a Uint8Array
import wasmBytes from './omd2typst-pkg/omd2typst_wasm_bg.wasm';

// The bg glue module exports are untyped (the .d.ts only covers raw wasm memory
// signatures). Cast to the string-level function types that the JS glue exposes.
const setWasm    = _setWasm          as unknown as (exports: WebAssembly.Exports) => void;
const renderFn   = _renderToTypst    as unknown as (
  md: string,
  tpl?: string,
  wikilinks?: string,
  vault?: string,
  math?: string,
  filenameCaptions?: boolean,
) => string;
const templateFn = _getBuiltinTemplate as unknown as () => string;

export interface RenderToTypstOptions {
  /** 'text' (default), 'bold', 'link' or 'keep'. */
  wikilinks?: string;
  /** Vault name for obsidian:// links to other notes (wikilinks: 'link'). */
  obsidianVault?: string;
  /** Syntax of math formulas: 'latex' (default) or 'typst'. */
  math?: string;
  /** Caption images without alt text with their file name. */
  filenameCaptions?: boolean;
}

let initialised = false;

async function ensureInit(): Promise<void> {
  if (initialised) return;

  // Instantiate directly from the bundled bytes (no fetch needed).
  const { instance } = await WebAssembly.instantiate(wasmBytes as unknown as ArrayBuffer, {
    './omd2typst_wasm_bg.js': {},
  });

  // Wire the wasm instance exports into the bg glue module.
  setWasm(instance.exports);

  initialised = true;
}

/**
 * Convert Markdown to a Typst source string.
 * Pass the full content of a .typ template as templateSrc, or null for the built-in.
 */
export async function renderToTypst(
  markdown: string,
  templateSrc: string | null,
  options: RenderToTypstOptions = {},
): Promise<string> {
  await ensureInit();
  return renderFn(markdown, templateSrc ?? undefined, options.wikilinks, options.obsidianVault, options.math, options.filenameCaptions);
}

/** Return the built-in Typst template source. */
export async function getBuiltinTemplate(): Promise<string> {
  await ensureInit();
  return templateFn();
}
