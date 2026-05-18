import { render_to_typst, get_builtin_template } from './omd2typst-pkg/omd2typst_wasm';

/**
 * Convert Markdown to a Typst source string.
 * Pass the full content of a .typ template as templateSrc, or null for the built-in.
 *
 * The WASM is initialised synchronously at module-load time by the esbuild
 * syncWasmPlugin, so no async init call is required.
 */
export async function renderToTypst(
  markdown: string,
  templateSrc: string | null,
): Promise<string> {
  return render_to_typst(markdown, templateSrc ?? undefined);
}

/** Return the built-in Typst template source. */
export async function getBuiltinTemplate(): Promise<string> {
  return get_builtin_template();
}
