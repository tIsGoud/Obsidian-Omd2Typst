import { App, Notice, TFile } from 'obsidian';

interface MermaidApi {
  initialize: (config: Record<string, unknown>) => void;
  render: (id: string, definition: string) => Promise<{ svg: string }>;
}

function getMermaid(): MermaidApi | undefined {
  if (typeof window === 'undefined') return undefined;
  const w = window as unknown as Record<string, unknown>;
  return w['mermaid'] as MermaidApi | undefined;
}

let mermaidInitialized = false;

/**
 * Extract a leading mermaid frontmatter `title:` and strip it from the source
 * so mermaid doesn't also render it inside the SVG. Returns the (unescaped)
 * title and the cleaned source. Other frontmatter keys (e.g. `config:`) are
 * preserved.
 */
export function extractMermaidTitle(source: string): { title: string | null; cleanSource: string } {
  const fmRe = /^---\n([\s\S]*?)\n---\n/;
  const m = fmRe.exec(source);
  if (!m) return { title: null, cleanSource: source };

  const fmContent = m[1];
  const titleLineRe = /^title:\s*(.+?)\s*$/m;
  const titleMatch = titleLineRe.exec(fmContent);
  if (!titleMatch) return { title: null, cleanSource: source };

  const title = titleMatch[1].trim();
  if (!title) return { title: null, cleanSource: source };

  const remainingLines = fmContent.split('\n').filter(line => !/^title:\s*/.test(line));
  const remaining = remainingLines.join('\n').trim();
  const cleanSource = remaining === ''
    ? source.slice(m[0].length)
    : `---\n${remaining}\n---\n` + source.slice(m[0].length);

  return { title, cleanSource };
}

/** Escape Markdown special characters in image alt text. */
function escapeMarkdownAlt(s: string): string {
  return s
    .replace(/[\r\n]+/g, ' ')
    .replace(/\\/g, '\\\\')
    .replace(/\[/g, '\\[')
    .replace(/\]/g, '\\]');
}

/**
 * Replace each `<foreignObject>…</foreignObject>` in the SVG with an SVG
 * `<text>` element positioned at the centre of the foreignObject's box.
 *
 * Mermaid's `flowchart-v2` renderer (used in mermaid v11+) emits node labels
 * as foreignObject-wrapped HTML *regardless* of the `htmlLabels: false`
 * config setting — that setting only affects edges. resvg (the SVG renderer
 * Typst uses for `image()`) does not support foreignObject, so without this
 * pass every flowchart node in the exported PDF would be an empty box.
 *
 * The inner HTML is stripped to plain text. Empty foreignObjects (e.g. the
 * placeholder edge-label between two siblings) are removed entirely.
 */
export function inlineForeignObjectLabels(svg: string): string {
  const re = /<foreignObject([^>]*?)>([\s\S]*?)<\/foreignObject>/g;
  return svg.replace(re, (_match, attrs: string, content: string) => {
    const widthMatch = /width="([\d.]+)"/.exec(attrs);
    const heightMatch = /height="([\d.]+)"/.exec(attrs);
    const width = widthMatch ? parseFloat(widthMatch[1]) : 0;
    const height = heightMatch ? parseFloat(heightMatch[1]) : 0;

    // Strip emoji codepoints (base pictographs, modifiers, ZWJ, VS16) from the
    // label. resvg (Typst's SVG renderer) can't render them cleanly and any
    // font fallback we tried either produced tofu or overflowed the node
    // boundary that mermaid had sized via browser-side measurement — dropping
    // the glyphs and keeping the surrounding text is the least-bad option.
    const text = content
      .replace(/<[^>]*>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      // Strip base pictographs, skin-tone modifiers, plus ZWJ (U+200D)
      // and VS16 (U+FE0F, emoji presentation selector) — otherwise these
      // invisible joiners remain after the pictographs they bound to are gone.
      .replace(/\p{Extended_Pictographic}|\p{Emoji_Modifier}|\u200D|\uFE0F/gu, '')
      .replace(/\s+/g, ' ')
      .trim();

    if (!text) return '';

    const escaped = text
      .replace(/&(?!\w+;)/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    return `<text x="${width / 2}" y="${height / 2}" text-anchor="middle" `
      + `dominant-baseline="central" font-family="sans-serif" font-size="14" `
      + `fill="#333">${escaped}</text>`;
  });
}

export async function renderMermaidBlocks(
  markdown: string,
  app: App,
  noteFile: TFile,
): Promise<{ markdown: string; cleanup: () => Promise<void> }> {
  const noop = async () => {};

  // Collect all fenced mermaid blocks with their positions
  const re = /^```mermaid\n([\s\S]*?)^```/gm;
  const blocks: Array<{ start: number; end: number; source: string }> = [];
  let match: RegExpExecArray | null;
  while ((match = re.exec(markdown)) !== null) {
    blocks.push({ start: match.index, end: match.index + match[0].length, source: match[1] });
  }

  if (blocks.length === 0) {
    return { markdown, cleanup: noop };
  }

  const mermaid = getMermaid();
  if (!mermaid) {
    new Notice(
      "Mermaid diagrams not rendered — Obsidian's Mermaid library was not found. Restart Obsidian and try again.",
    );
    return { markdown, cleanup: noop };
  }

  if (!mermaidInitialized) {
    // `flowchart.htmlLabels: false` makes mermaid emit SVG <text> elements for
    // flowchart labels instead of <foreignObject>-wrapped HTML. resvg (used by
    // Typst for image()) can't render <foreignObject>, so without this setting
    // every flowchart in the PDF would be blank boxes with no text.
    // Side effect: also changes how Obsidian's editor preview renders
    // flowcharts until the app is restarted.
    mermaid.initialize({
      startOnLoad: false,
      flowchart: { htmlLabels: false },
    });
    mermaidInitialized = true;
  }

  const dir = noteFile.parent ? noteFile.parent.path + '/' : '';
  const writtenPaths: string[] = [];
  // Default: keep original block text (used when render fails)
  const replacements: string[] = blocks.map(b => markdown.slice(b.start, b.end));

  for (let i = 0; i < blocks.length; i++) {
    const svgName = `${noteFile.basename}-mermaid-${i}.svg`;
    const svgPath = `${dir}${svgName}`;
    // Extract `title:` from the mermaid frontmatter (if present) so we can use
    // it as the Typst figure caption. Strip it from the source we send to
    // mermaid so the title isn't ALSO baked into the SVG.
    const { title, cleanSource } = extractMermaidTitle(blocks[i].source);
    try {
      const { svg } = await mermaid.render(`omd2typst-mermaid-${i}`, cleanSource);
      // Replace foreignObject node labels (flowchart-v2) with SVG <text> so
      // resvg / Typst can render them — without this, flowchart node boxes
      // appear blank in the PDF.
      const cleanedSvg = inlineForeignObjectLabels(svg);
      await app.vault.adapter.write(svgPath, cleanedSvg);
      writtenPaths.push(svgPath);
      // The temp .typ is written next to the note (see typst-cli.ts), so the
      // image ref is the bare filename — Typst resolves relative paths from
      // the .typ file's directory. Wrap in angle brackets so CommonMark
      // accepts spaces in the note basename. Use the extracted mermaid title
      // as alt text → becomes the Typst caption.
      const alt = title ? escapeMarkdownAlt(title) : '';
      replacements[i] = `![${alt}](<${svgName}>)`;
    } catch (err) {
      new Notice(
        `Mermaid diagram ${i + 1} could not be rendered: ${(err as Error).message}.`,
      );
    }
  }

  // Rebuild string in reverse order so earlier positions stay valid
  let result = markdown;
  for (let i = blocks.length - 1; i >= 0; i--) {
    result = result.slice(0, blocks[i].start) + replacements[i] + result.slice(blocks[i].end);
  }

  return {
    markdown: result,
    cleanup: async () => {
      for (const p of writtenPaths) {
        try { await app.vault.adapter.remove(p); } catch { /* leftover SVG is harmless */ }
      }
    },
  };
}
