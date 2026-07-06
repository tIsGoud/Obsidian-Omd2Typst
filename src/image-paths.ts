import { App, TFile } from 'obsidian';

/**
 * Image-path resolution preprocessor.
 *
 * The engine (omd2typst) emits image `src` values verbatim. Typst resolves a
 * relative `image("path")` from the `.typ` file's own directory (the note's
 * folder — see ADR 0012). That makes folder-relative links work but breaks two
 * link styles Obsidian genuinely produces:
 *
 *   - vault-root paths WITHOUT a leading slash (`04-Personal/…/foo.png`), which
 *     Obsidian's "Absolute path in vault" link format generates, and
 *   - bare filenames ("Shortest path" format) whose file lives in a subfolder.
 *
 * Both resolve to a *doubled* path under the note folder and fail to compile.
 *
 * This pass reproduces Obsidian's own resolution: every image reference is
 * resolved to the actual vault file and rewritten to a `/`-prefixed vault-root
 * path, which Typst then routes through `--root <vault>`. Links that don't
 * resolve to a real image file are left untouched, so illustrative paths and
 * examples inside prose are never harmed.
 *
 * Implements ADR 0012's deferred "Option 1". Runs as a Markdown-in/Markdown-out
 * pass (ADR 0008), after Bases and BEFORE Mermaid — Mermaid emits its own
 * bare-filename references afterward, which must not be resolved here.
 */

const IMAGE_EXTENSIONS = new Set([
  'png', 'jpg', 'jpeg', 'gif', 'svg', 'webp', 'bmp', 'avif', 'ico', 'tiff', 'tif',
]);

/** Matches a scheme (`https:`, `data:`, `mailto:`) — an external/non-vault ref. */
const EXTERNAL_RE = /^[a-z][a-z0-9+.-]*:/i;

/** CommonMark inline image: `![alt](dest)` / `![alt](<dest>)` / `![alt](dest "title")`. */
const MD_IMAGE_RE = /!\[([^\]]*)\]\(\s*(<[^>]*>|[^)\s]+)((?:\s+"[^"]*")?)\s*\)/g;

/** Obsidian embed: `![[link]]`, `![[link|width]]`. */
const WIKILINK_EMBED_RE = /!\[\[([^\]\n]+)\]\]/g;

/** Normalise a `/`-separated vault path, collapsing `.` and `..` segments. */
function normalizeVaultPath(p: string): string {
  const out: string[] = [];
  for (const seg of p.split('/')) {
    if (seg === '' || seg === '.') continue;
    if (seg === '..') { out.pop(); continue; }
    out.push(seg);
  }
  return out.join('/');
}

function dirOf(path: string): string {
  const i = path.lastIndexOf('/');
  return i === -1 ? '' : path.slice(0, i);
}

function isImageFile(file: TFile): boolean {
  return IMAGE_EXTENSIONS.has(file.extension.toLowerCase());
}

/**
 * Resolve an image reference to a vault file the way Obsidian would, or null.
 *
 * Note-relative resolution is tried first (matching Obsidian's preview, and the
 * only way to honour `./` and `../`); the link resolver is the fallback for
 * vault-root paths and bare "shortest path" filenames.
 */
function resolveImageFile(app: App, rawPath: string, notePath: string): TFile | null {
  let p = rawPath.trim();
  try { p = decodeURIComponent(p); } catch { /* leave as-is on malformed escapes */ }

  if (p === '' || p.startsWith('/') || p.startsWith('//') || EXTERNAL_RE.test(p)) {
    return null;
  }

  // 1) Relative to the note's folder (handles `foo.png`, `_assets/foo.png`, `./`, `../`).
  const relTarget = normalizeVaultPath(`${dirOf(notePath)}/${p}`);
  const relFile = app.vault.getAbstractFileByPath(relTarget);
  if (relFile instanceof TFile && isImageFile(relFile)) return relFile;

  // 2) Obsidian's link resolver — vault-root path, or shortest-path basename match.
  const dest = app.metadataCache.getFirstLinkpathDest(normalizeVaultPath(p), notePath);
  if (dest instanceof TFile && isImageFile(dest)) return dest;

  return null;
}

/** Rewrite image references in a chunk of text known to be outside any code. */
function rewriteChunk(text: string, app: App, notePath: string): string {
  // Wikilink embeds first — they never overlap the markdown-image syntax.
  let result = text.replace(WIKILINK_EMBED_RE, (whole, inner: string) => {
    const bar = inner.indexOf('|');
    const linkpath = (bar >= 0 ? inner.slice(0, bar) : inner).split('#')[0].trim();
    const file = resolveImageFile(app, linkpath, notePath);
    if (!file) return whole;
    // Mirror the engine's `![[path|X]]` → `![|X](path)` conversion, but emit an
    // angle-bracketed, `/`-absolute destination (ADR 0002 + ADR 0012).
    const alt = bar >= 0 ? `|${inner.slice(bar + 1).trim()}` : '';
    return `![${alt}](</${file.path}>)`;
  });

  result = result.replace(MD_IMAGE_RE, (whole, alt: string, dest: string, title: string) => {
    const bare = dest.startsWith('<') && dest.endsWith('>') ? dest.slice(1, -1) : dest;
    const file = resolveImageFile(app, bare, notePath);
    if (!file) return whole;
    return `![${alt}](</${file.path}>${title})`;
  });

  return result;
}

/** Apply `fn` to the parts of a line outside inline-code spans. */
function outsideInlineCode(line: string, fn: (s: string) => string): string {
  return line
    .split(/(`+[^`]*`+)/g)
    .map(seg => (seg.startsWith('`') ? seg : fn(seg)))
    .join('');
}

/**
 * Resolve every image reference in `markdown` to a `/`-absolute vault path.
 * Fenced code blocks and inline code spans are left verbatim.
 */
export function resolveImagePaths(markdown: string, app: App, file: TFile): string {
  const notePath = file.path;
  const lines = markdown.split('\n');

  let fenceChar = '';   // '`' or '~' while inside a fenced block; '' otherwise
  let fenceLen = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const open = line.match(/^(\s*)(`{3,}|~{3,})/);

    if (fenceChar) {
      // Inside a fence — look for a matching closing fence, rewrite nothing.
      const close = line.match(/^\s*(`{3,}|~{3,})\s*$/);
      if (close && close[1][0] === fenceChar && close[1].length >= fenceLen) {
        fenceChar = '';
        fenceLen = 0;
      }
      continue;
    }

    if (open) {
      // Opening fence — enter fenced state, don't rewrite the fence line.
      fenceChar = open[2][0];
      fenceLen = open[2].length;
      continue;
    }

    lines[i] = outsideInlineCode(line, seg => rewriteChunk(seg, app, notePath));
  }

  return lines.join('\n');
}
