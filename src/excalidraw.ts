import { App, Notice, TFile } from 'obsidian';
import type { ExcalidrawImageMode } from './settings';
import { markdownImage, parseEmbedOptions } from './embed-options';

/**
 * Excalidraw preprocessor.
 *
 * `![[Drawing.excalidraw]]` / `![[Drawing.excalidraw|500]]` embeds point at an
 * Excalidraw drawing (`Drawing.excalidraw.md`), which Typst cannot show. This
 * pass renders each embedded drawing to an image with the Excalidraw plugin's
 * scripting API (`ExcalidrawAutomate`) and rewrites the embed to a normal
 * image reference. It is a Markdown-in/Markdown-out pass (ADR 0008) that runs
 * after the image-path resolver and next to Mermaid: the temporary image is not
 * in Obsidian's file index yet, so — like Mermaid — it is referenced by bare
 * filename next to the note and removed again after a PDF export.
 *
 * Drawings are always exported with the light theme and a white background,
 * whatever Obsidian's theme is, so they print properly.
 *
 * Without the Excalidraw plugin the pass falls back to an image the plugin
 * already exported next to the drawing ("Auto-export SVG/PNG"), and otherwise
 * leaves the embed untouched.
 */

/** Scale of the exported PNG (2 = twice the drawing's size, sharp in print). */
const PNG_SCALE = 2;

/**
 * Local structural types for the part of Excalidraw's API we use. Declared here
 * (instead of importing Excalidraw types) because the plugin is a runtime
 * dependency only, and so `obsidianmd/no-unsupported-api` stays quiet — same
 * approach as bases.ts (ADR 0005).
 */
export interface ExcalidrawAutomateLike {
  reset(): void;
  getExportSettings(withBackground: boolean, withTheme: boolean): unknown;
  getEmbeddedFilesLoader(isDark?: boolean): unknown;
  createPNG(
    templatePath?: string, scale?: number, exportSettings?: unknown,
    loader?: unknown, theme?: string, padding?: number,
  ): Promise<{ arrayBuffer(): Promise<ArrayBuffer> }>;
  createSVG(
    templatePath?: string, embedFont?: boolean, exportSettings?: unknown,
    loader?: unknown, theme?: string, padding?: number,
  ): Promise<unknown>;
  destroy?(): void;
}

interface ExcalidrawGlobal {
  getAPI(): ExcalidrawAutomateLike | null;
}

/** Obsidian embed: `![[link]]`, `![[link|width]]`. */
const WIKILINK_EMBED_RE = /!\[\[([^\]\n]+)\]\]/g;

/** True for an embed target that names an Excalidraw drawing. */
export function isExcalidrawLink(linkpath: string): boolean {
  return /\.excalidraw(\.md)?$/i.test(linkpath.trim());
}

/** Excalidraw's scripting API, or null when the plugin is not installed/enabled. */
function getExcalidrawApi(): ExcalidrawAutomateLike | null {
  if (typeof window === 'undefined') return null;
  const g = (window as unknown as { ExcalidrawAutomate?: ExcalidrawGlobal }).ExcalidrawAutomate;
  try {
    return g?.getAPI() ?? null;
  } catch {
    return null;
  }
}

function resolveDrawing(app: App, linkpath: string, notePath: string): TFile | null {
  const p = linkpath.trim();
  const candidates = /\.md$/i.test(p) ? [p] : [`${p}.md`, p];
  for (const c of candidates) {
    const dest = app.metadataCache.getFirstLinkpathDest(c, notePath);
    if (dest instanceof TFile) return dest;
  }
  return null;
}

/** An image Excalidraw's "auto-export" already wrote next to the drawing, if any. */
function findAutoExport(app: App, drawing: TFile, mode: ExcalidrawImageMode): string | null {
  const base = drawing.path.replace(/\.md$/i, '');
  const exts = mode === 'svg'
    ? ['.svg', '.light.svg', '.png', '.light.png']
    : ['.png', '.light.png', '.svg', '.light.svg'];
  for (const ext of exts) {
    if (app.vault.getAbstractFileByPath(base + ext) instanceof TFile) return base + ext;
  }
  return null;
}

/** Apply `fn` to the parts of a line outside inline-code spans. */
function outsideInlineCode(line: string, fn: (s: string) => string): string {
  return line
    .split(/(`+[^`]*`+)/g)
    .map(seg => (seg.startsWith('`') ? seg : fn(seg)))
    .join('');
}

/** Run `fn` on every line outside fenced code blocks (lines are replaced in place). */
function mapLinesOutsideFences(markdown: string, fn: (line: string) => string): string {
  const lines = markdown.split('\n');
  let fenceChar = '';
  let fenceLen = 0;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (fenceChar) {
      const close = line.match(/^\s*(`{3,}|~{3,})\s*$/);
      if (close && close[1][0] === fenceChar && close[1].length >= fenceLen) {
        fenceChar = '';
        fenceLen = 0;
      }
      continue;
    }
    const open = line.match(/^(\s*)(`{3,}|~{3,})/);
    if (open) {
      fenceChar = open[2][0];
      fenceLen = open[2].length;
      continue;
    }
    lines[i] = outsideInlineCode(line, fn);
  }
  return lines.join('\n');
}

/** Split `![[link#frag|options]]` contents into link path, fragment and options. */
function splitEmbed(inner: string): { linkpath: string; fragment: string; options: string } {
  const bar = inner.indexOf('|');
  const target = bar >= 0 ? inner.slice(0, bar) : inner;
  const options = bar >= 0 ? inner.slice(bar + 1) : '';
  const hash = target.indexOf('#');
  return {
    linkpath: (hash >= 0 ? target.slice(0, hash) : target).trim(),
    fragment: hash >= 0 ? target.slice(hash + 1) : '',
    options,
  };
}

export interface ExcalidrawResult {
  markdown: string;
  /** Removes the temporary images written next to the note. */
  cleanup: () => Promise<void>;
}

/**
 * Render the Excalidraw drawings embedded in `markdown` to images and rewrite
 * the embeds to image references. `mode` is the image format ('off' = leave
 * the embeds alone). Alt text and width come from the embed (`|500|alt text`);
 * with `filenameCaptions` a drawing without alt text is captioned with its name.
 */
export async function renderExcalidrawEmbeds(
  markdown: string,
  app: App,
  noteFile: TFile,
  mode: ExcalidrawImageMode,
  filenameCaptions = false,
): Promise<ExcalidrawResult> {
  const noop = async () => {};
  if (mode === 'off') return { markdown, cleanup: noop };

  // Pass 1: the distinct drawings embedded outside code. A fragment
  // (`#^frame=…`) selects part of a drawing, which we cannot render: skipped.
  const drawings = new Map<string, TFile>();
  mapLinesOutsideFences(markdown, line => {
    for (const m of line.matchAll(WIKILINK_EMBED_RE)) {
      const { linkpath, fragment } = splitEmbed(m[1]);
      if (fragment || !isExcalidrawLink(linkpath) || drawings.has(linkpath)) continue;
      const file = resolveDrawing(app, linkpath, noteFile.path);
      if (file) drawings.set(linkpath, file);
    }
    return line;
  });
  if (drawings.size === 0) return { markdown, cleanup: noop };

  // Render each drawing once. `images` maps the embed's link path to the image
  // reference to use: a bare filename (temp file next to the note) or a
  // `/`-absolute vault path (an existing auto-exported image).
  const dir = noteFile.parent && noteFile.parent.path !== '/' ? `${noteFile.parent.path}/` : '';
  const written: string[] = [];
  const images = new Map<string, string>();
  const ea = getExcalidrawApi();
  let index = 0;

  for (const [linkpath, file] of drawings) {
    const name = `${noteFile.basename}-excalidraw-${index++}.${mode}`;
    let reference: string | null = null;
    if (ea) {
      try {
        reference = await renderDrawing(app, ea, file, mode, `${dir}${name}`) ? name : null;
        if (reference) written.push(`${dir}${name}`);
      } catch (err) {
        new Notice(`Excalidraw drawing '${file.basename}' could not be rendered: ${(err as Error).message}.`);
      }
    }
    if (!reference) {
      const exported = findAutoExport(app, file, mode);
      if (exported) reference = `/${exported}`;
    }
    if (reference) images.set(linkpath, reference);
  }

  if (!ea && images.size < drawings.size) {
    new Notice(
      'Excalidraw drawings not rendered: the Excalidraw plugin was not found. ' +
      'Install and enable it, or turn on its "Auto-export SVG/PNG" option.',
    );
  }
  try { ea?.destroy?.(); } catch { /* nothing to release */ }

  // Pass 2: rewrite the embeds.
  const result = mapLinesOutsideFences(markdown, line =>
    line.replace(WIKILINK_EMBED_RE, (whole, inner: string) => {
      const { linkpath, fragment, options } = splitEmbed(inner);
      const reference = fragment ? undefined : images.get(linkpath);
      if (!reference) return whole;
      // The alt text becomes the figure caption. Without one the drawing is
      // only captioned when the file-name option is on (the engine cannot do
      // it: it sees the temporary image's name).
      const { alt, width } = parseEmbedOptions(options);
      const caption = alt || (filenameCaptions ? (drawings.get(linkpath)?.basename ?? '').replace(/\.excalidraw$/i, '') : '');
      return markdownImage(caption, width, reference);
    }),
  );

  return {
    markdown: result,
    cleanup: async () => {
      for (const p of written) {
        try { await app.vault.adapter.remove(p); } catch { /* a leftover image is harmless */ }
      }
    },
  };
}

/** Render one drawing to `outPath`. Returns false when Excalidraw gave nothing. */
async function renderDrawing(
  app: App,
  ea: ExcalidrawAutomateLike,
  drawing: TFile,
  mode: 'png' | 'svg',
  outPath: string,
): Promise<boolean> {
  ea.reset();
  // Light theme and white background, whatever Obsidian's theme is.
  const settings = ea.getExportSettings(true, true);
  const loader = ea.getEmbeddedFilesLoader(false);
  if (mode === 'png') {
    const png = await ea.createPNG(drawing.path, PNG_SCALE, settings, loader, 'light');
    if (!png) return false;
    await app.vault.adapter.writeBinary(outPath, await png.arrayBuffer());
    return true;
  }
  // Typst ignores web fonts, so do not inline Excalidraw's (large) font data.
  const svgSettings = { ...(settings as object), skipInliningFonts: true };
  const svg = await ea.createSVG(drawing.path, false, svgSettings, loader, 'light');
  if (!svg) return false;
  await app.vault.adapter.write(outPath, new XMLSerializer().serializeToString(svg as Node));
  return true;
}
