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
    mermaid.initialize({ startOnLoad: false });
    mermaidInitialized = true;
  }

  const dir = noteFile.parent ? noteFile.parent.path + '/' : '';
  const writtenPaths: string[] = [];
  // Default: keep original block text (used when render fails)
  const replacements: string[] = blocks.map(b => markdown.slice(b.start, b.end));

  for (let i = 0; i < blocks.length; i++) {
    const svgPath = `${dir}${noteFile.basename}-mermaid-${i}.svg`;
    try {
      const { svg } = await mermaid.render(`omd2typst-mermaid-${i}`, blocks[i].source);
      await app.vault.adapter.write(svgPath, svg);
      writtenPaths.push(svgPath);
      // Wrap path in angle brackets so CommonMark accepts spaces and other
       // special characters (note titles can contain anything).
      replacements[i] = `![](<${svgPath}>)`;
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
