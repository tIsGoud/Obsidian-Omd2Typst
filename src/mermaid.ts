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
    const svgPath = `${dir}${noteFile.basename}-mermaid-${i}.svg`;
    // Extract `title:` from the mermaid frontmatter (if present) so we can use
    // it as the Typst figure caption. Strip it from the source we send to
    // mermaid so the title isn't ALSO baked into the SVG.
    const { title, cleanSource } = extractMermaidTitle(blocks[i].source);
    try {
      const { svg } = await mermaid.render(`omd2typst-mermaid-${i}`, cleanSource);
      await app.vault.adapter.write(svgPath, svg);
      writtenPaths.push(svgPath);
      // Wrap path in angle brackets so CommonMark accepts spaces and other
      // special characters (note titles can contain anything). Use the
      // extracted mermaid title as alt text → becomes the Typst caption.
      const alt = title ? escapeMarkdownAlt(title) : '';
      replacements[i] = `![${alt}](<${svgPath}>)`;
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
