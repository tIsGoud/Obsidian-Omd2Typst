import init, { render_to_typst, get_builtin_template } from './omd2typst-pkg/omd2typst_wasm';

let initialised = false;

async function ensureInit(): Promise<void> {
  if (initialised) return;
  await init();
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
