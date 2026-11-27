import { App, loadPdfJs } from 'obsidian';
import { mapLinesOutsideFences } from './md-code';

/**
 * Page counts for PDF embeds.
 *
 * With the "PDF embeds" setting on, the engine includes every page of an
 * embedded PDF (`![[annex.pdf]]`). Typst cannot count a PDF's pages and the
 * engine runs as WASM without file access, so the plugin counts them here with
 * Obsidian's own PDF library and hands the numbers to the engine.
 */

/** Local structural type for the part of pdf.js we use (Obsidian returns `any`). */
interface PdfJsLike {
  getDocument(source: { data: Uint8Array }): {
    promise: Promise<{ numPages: number; destroy?: () => unknown }>;
  };
}

/** CommonMark inline image: `![alt](dest)` / `![alt](<dest>)` / `![alt](dest "title")`. */
const MD_IMAGE_RE = /!\[([^\]]*)\]\(\s*(<[^>]*>|[^)\s]+)((?:\s+"[^"]*")?)\s*\)/g;

interface PdfRef {
  /** `/`-absolute vault path of the PDF. */
  path: string;
  fragment: string;
}

/** Every PDF image reference outside code, with its `#fragment`. */
function pdfRefs(markdown: string): PdfRef[] {
  const found: PdfRef[] = [];
  mapLinesOutsideFences(markdown, line => {
    // A fresh regex per line: a shared /g regex keeps `lastIndex` between calls.
    const re = new RegExp(MD_IMAGE_RE.source, 'g');
    let m: RegExpExecArray | null;
    while ((m = re.exec(line)) !== null) {
      const dest = m[2].startsWith('<') && m[2].endsWith('>') ? m[2].slice(1, -1) : m[2];
      const hash = dest.indexOf('#');
      const path = hash >= 0 ? dest.slice(0, hash) : dest;
      const fragment = hash >= 0 ? dest.slice(hash + 1) : '';
      if (/\.pdf$/i.test(path) && path.startsWith('/')) found.push({ path, fragment });
    }
    return line;
  });
  return found;
}

/** True when the note embeds at least one PDF. */
export function hasPdfEmbeds(markdown: string): boolean {
  return pdfRefs(markdown).length > 0;
}

/**
 * True unless the fragment names its pages explicitly: a closed range
 * (`page=2-4`) or a list (`page=3,5,7`). All pages (no `page=`) and a bare
 * `page=3` (from page 3 to the last page) need the page count.
 */
function needsPageCount(fragment: string): boolean {
  const value = fragment.split('&').find(kv => kv.startsWith('page='));
  return value === undefined || !(/^page=\d+-\d+$/.test(value) || value.includes(','));
}

/**
 * The `/`-absolute paths of PDFs whose page count the engine needs: embedded
 * without a `#page=` selection, or with `#page=3` (through the last page).
 * Embeds inside code are ignored.
 */
export function collectPdfEmbeds(markdown: string): string[] {
  const paths = pdfRefs(markdown).filter(r => needsPageCount(r.fragment)).map(r => r.path);
  return [...new Set(paths)];
}

/** Count the pages of each PDF (keys are the `/`-absolute paths). Unreadable PDFs are left out. */
export async function countPdfPages(app: App, paths: string[]): Promise<Record<string, number>> {
  const counts: Record<string, number> = {};
  if (paths.length === 0) return counts;
  let pdfjs: PdfJsLike;
  try {
    pdfjs = (await loadPdfJs()) as PdfJsLike;
  } catch {
    return counts;
  }
  for (const path of paths) {
    try {
      const data = await app.vault.adapter.readBinary(path.slice(1));
      const doc = await pdfjs.getDocument({ data: new Uint8Array(data) }).promise;
      counts[path] = doc.numPages;
      void doc.destroy?.();
    } catch {
      // The engine shows its placeholder for a PDF without a count.
    }
  }
  return counts;
}

/** The page counts as the engine expects them: one `<count>\t<path>` line per PDF. */
export function formatPdfPages(counts: Record<string, number>): string {
  return Object.entries(counts).map(([path, n]) => `${n}\t${path}`).join('\n');
}
