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

/** Font size used in the emitted SVG `<text>`. Also drives width estimates. */
const LABEL_FONT_SIZE = 14;
/** Line height as a multiple of the em-box, matching typical CSS defaults. */
const LABEL_LINE_HEIGHT_EM = 1.2;
/**
 * Average glyph advance for sans-serif, expressed as a fraction of font size.
 * Approximate — actual metrics depend on the specific font resvg picks.
 */
const AVG_CHAR_WIDTH_FACTOR = 0.55;

/** Escape XML special characters for embedding in SVG text content. */
function escapeSvgText(s: string): string {
  return s
    .replace(/&(?!\w+;)/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * Decode the common named XML/HTML entities so wrap-width measurement counts
 * visible characters, not encoded byte length. `&amp;` must be replaced last
 * to avoid unmasking a downstream `&…;`.
 */
function decodeCommonEntities(s: string): string {
  return s
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&');
}

/**
 * Wrap a single line of text into multiple lines that each fit within the
 * given box width, splitting at word boundaries. A word wider than the box
 * is kept intact (it will overflow — inevitable without breaking a word).
 */
export function wrapLabelLine(text: string, boxWidth: number): string[] {
  if (boxWidth <= 0) return [text];
  const maxChars = Math.max(1, Math.floor(boxWidth / (LABEL_FONT_SIZE * AVG_CHAR_WIDTH_FACTOR)));
  if (text.length <= maxChars) return [text];

  const lines: string[] = [];
  let current = '';
  for (const word of text.split(' ')) {
    if (current === '') {
      current = word;
    } else if (current.length + 1 + word.length <= maxChars) {
      current += ' ' + word;
    } else {
      lines.push(current);
      current = word;
    }
  }
  if (current !== '') lines.push(current);
  return lines;
}

/**
 * Extract visible text lines from a `<foreignObject>` HTML payload.
 *
 *  1. Explicit `<br>` tags in the source become hard line breaks.
 *  2. All other HTML tags are stripped to whitespace.
 *  3. `&nbsp;` becomes a space; emoji codepoints (base pictographs,
 *     modifiers, ZWJ, VS16) are removed — resvg can't render them cleanly.
 *  4. Whitespace is collapsed per line; empty lines are dropped.
 *  5. If step 1 produced multiple lines they are honoured as-is; otherwise
 *     the single line is auto-wrapped to fit `boxWidth`.
 */
export function extractLabelLines(content: string, boxWidth: number): string[] {
  const cleaned = content
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\p{Extended_Pictographic}|\p{Emoji_Modifier}|‍|️/gu, '');

  const rawLines = cleaned.split('\n');
  const explicitBreak = rawLines.length > 1;
  const lines = rawLines
    .map(l => decodeCommonEntities(l).replace(/\s+/g, ' ').trim())
    .filter(l => l.length > 0);

  if (lines.length === 0) return [];
  if (explicitBreak) return lines;
  return wrapLabelLine(lines[0], boxWidth);
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
 * Multi-line output uses one `<tspan>` per line, so labels mermaid wrapped
 * in the browser (via CSS on the HTML label) also wrap in the PDF. Empty
 * foreignObjects (e.g. the placeholder edge label between siblings) are
 * removed entirely.
 */
export function inlineForeignObjectLabels(svg: string): string {
  const re = /<foreignObject([^>]*?)>([\s\S]*?)<\/foreignObject>/g;
  return svg.replace(re, (_match, attrs: string, content: string) => {
    const widthMatch = /width="([\d.]+)"/.exec(attrs);
    const heightMatch = /height="([\d.]+)"/.exec(attrs);
    const width = widthMatch ? parseFloat(widthMatch[1]) : 0;
    const height = heightMatch ? parseFloat(heightMatch[1]) : 0;

    const lines = extractLabelLines(content, width);
    if (lines.length === 0) return '';

    const cx = width / 2;
    const cy = height / 2;
    const commonAttrs = `x="${cx}" y="${cy}" text-anchor="middle" `
      + `dominant-baseline="central" font-family="sans-serif" `
      + `font-size="${LABEL_FONT_SIZE}" fill="#333"`;

    if (lines.length === 1) {
      return `<text ${commonAttrs}>${escapeSvgText(lines[0])}</text>`;
    }

    // Vertically centre N lines around the box centre: shift the first line
    // up by (N-1)/2 line-heights, then each subsequent line down by one full
    // line-height via `dy`. `x` on each tspan resets the horizontal origin.
    const firstDy = -((lines.length - 1) / 2) * LABEL_LINE_HEIGHT_EM;
    const tspans = lines.map((line, i) => {
      const dy = i === 0 ? `${firstDy}em` : `${LABEL_LINE_HEIGHT_EM}em`;
      return `<tspan x="${cx}" dy="${dy}">${escapeSvgText(line)}</tspan>`;
    }).join('');

    return `<text ${commonAttrs}>${tspans}</text>`;
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
