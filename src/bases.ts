import { App, Component, Notice, TFile } from 'obsidian';

// The Bases API (Obsidian 1.10+) is not declared via Obsidian's public types here:
// the linter rule `obsidianmd/no-unsupported-api` would flag calls on those types
// because our `minAppVersion` is 1.7.2. We reach the bases engine only at runtime,
// after the embed is successfully created, so the API is guaranteed to exist.
// Local structural interfaces mirror the shapes we use without importing the
// typed classes.

// ---------------------------------------------------------------------------
// Embed detection
// ---------------------------------------------------------------------------

interface BaseEmbed {
  full: string;
  start: number;
  end: number;
  path: string;
  viewName: string | undefined;
}

function detectBaseEmbeds(markdown: string): BaseEmbed[] {
  const re = /!\[\[([^\]#|]+\.base)(?:#([^\]|]+))?\]\]/g;
  const results: BaseEmbed[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(markdown)) !== null) {
    results.push({
      full: m[0],
      start: m.index,
      end: m.index + m[0].length,
      path: m[1].trim(),
      viewName: m[2]?.trim(),
    });
  }
  return results;
}

// ---------------------------------------------------------------------------
// Query via Obsidian's own engine
//
// We use the bases embed creator that Obsidian registers internally and read
// the resulting view's typed `BasesViewConfig` and `BasesQueryResult`. The
// access paths into `embed.controller.view` are undocumented; the types we
// read from there (`BasesViewConfig`, `BasesQueryResult`, `BasesEntry`,
// `Value`) are all public.
// ---------------------------------------------------------------------------

interface BasesValueLike {
  toString(): string;
  isTruthy(): boolean;
}

interface BasesEntryLike {
  getValue(propertyId: string): BasesValueLike | null;
}

interface BasesViewConfigLike {
  getOrder(): string[];
  getDisplayName(propertyId: string): string;
}

interface BasesQueryResultLike {
  data: BasesEntryLike[];
}

interface BasesViewInternal {
  config: BasesViewConfigLike;
  data: BasesQueryResultLike;
}

interface BasesControllerInternal {
  view?: BasesViewInternal;
}

interface BasesEmbedInternal extends Component {
  controller?: BasesControllerInternal;
  loadFile?: () => Promise<void>;
}

interface EmbedContext {
  app: App;
  containerEl: HTMLElement;
  linktext: string;
  sourcePath: string;
}

type EmbedCreator = (
  context: EmbedContext,
  file: TFile,
  subpath: string,
) => BasesEmbedInternal;

interface EmbedRegistry {
  getEmbedCreator(file: TFile): EmbedCreator | null;
}

const HIDDEN_STYLES: Partial<CSSStyleDeclaration> = {
  position: 'absolute',
  left: '-99999px',
  top: '-99999px',
  visibility: 'hidden',
  width: '1200px',
};

async function queryBase(
  app: App,
  baseFile: TFile,
  viewName: string | undefined,
  noteFile: TFile,
  parent: Component,
): Promise<{ headers: string[]; rows: string[][] } | null> {
  const registry = (app as unknown as { embedRegistry?: EmbedRegistry }).embedRegistry;
  if (!registry) return null;
  const creator = registry.getEmbedCreator(baseFile);
  if (!creator) return null;

  const hiddenEl = activeDocument.createElement('div');
  hiddenEl.setCssStyles(HIDDEN_STYLES);
  activeDocument.body.appendChild(hiddenEl);

  const tmpComp = new Component();
  parent.addChild(tmpComp);

  try {
    const subpath = viewName ? `#${viewName}` : '';
    const ctx: EmbedContext = {
      app,
      containerEl: hiddenEl,
      linktext: baseFile.path + subpath,
      sourcePath: noteFile.path,
    };
    const embed = creator(ctx, baseFile, subpath);
    tmpComp.addChild(embed);

    if (typeof embed.loadFile === 'function') {
      await embed.loadFile();
    }

    // Bases queries are async + batched. Wait until the view's `data` is a
    // populated `BasesQueryResult`, with a brief settling delay so we read
    // after the final batch.
    const deadline = Date.now() + 5000;
    while (Date.now() < deadline) {
      const view = embed.controller?.view;
      if (view && view.config && view.data) {
        // Allow the query batches to settle.
        await new Promise(r => window.setTimeout(r, 150));

        const config = view.config;
        const columns = config.getOrder();
        const allHeaders = columns.map(c => config.getDisplayName(c));
        const entries = view.data.data;
        // Empty-cell semantics: a missing property (`getValue` returns null) and
        // a `NullValue` (which would `toString()` to the literal "null") are
        // both treated as empty. `Value.isTruthy()` reliably distinguishes
        // these from real data.
        const allRows = entries.map(entry =>
          columns.map(c => {
            const v = entry.getValue(c);
            if (!v || !v.isTruthy()) return '';
            return v.toString();
          }),
        );
        // Match Obsidian's UI auto-hide: drop columns whose cells are empty in
        // every row. Falls back to all columns if filtering would leave none.
        const visibleIdx: number[] = [];
        columns.forEach((_, idx) => {
          if (allRows.some(row => row[idx] !== '')) visibleIdx.push(idx);
        });
        const useIdx = visibleIdx.length > 0 ? visibleIdx : columns.map((_, i) => i);
        const headers = useIdx.map(i => allHeaders[i]);
        const rows = allRows.map(row => useIdx.map(i => row[i]));
        return { headers, rows };
      }
      await new Promise(r => window.setTimeout(r, 50));
    }

    return null;
  } catch (err) {
    console.error('[omd2typst] queryBase failed:', err);
    return null;
  } finally {
    parent.removeChild(tmpComp);
    hiddenEl.remove();
  }
}

// ---------------------------------------------------------------------------
// Markdown table generation
// ---------------------------------------------------------------------------

function buildTable(headers: string[], rows: string[][]): string {
  if (rows.length === 0) return '*No results.*';
  const sep = headers.map(() => '----');
  return [
    `| ${headers.join(' | ')} |`,
    `| ${sep.join(' | ')} |`,
    ...rows.map(r => `| ${r.join(' | ')} |`),
  ].join('\n');
}

// ---------------------------------------------------------------------------
// Main exported function
// ---------------------------------------------------------------------------

export async function renderBaseEmbeds(
  markdown: string,
  app: App,
  noteFile: TFile,
  parent: Component,
): Promise<string> {
  const embeds = detectBaseEmbeds(markdown);
  if (embeds.length === 0) return markdown;

  const replacements = new Map<number, string>();

  for (let i = 0; i < embeds.length; i++) {
    const embed = embeds[i];
    const baseName = embed.path.split('/').pop() ?? embed.path;

    const baseFile = app.metadataCache.getFirstLinkpathDest(embed.path, noteFile.path);
    if (!baseFile) {
      new Notice(`Base not found: ${baseName}`);
      replacements.set(i, `*[Base not found: ${baseName}]*`);
      continue;
    }

    const result = await queryBase(app, baseFile, embed.viewName, noteFile, parent);
    if (!result) {
      new Notice(`Could not render base view: ${baseName}`);
      replacements.set(i, `*[Base view '${baseName}' not rendered]*`);
      continue;
    }

    replacements.set(i, buildTable(result.headers, result.rows));
  }

  // Rebuild markdown right-to-left so earlier positions stay valid.
  let result = markdown;
  for (let i = embeds.length - 1; i >= 0; i--) {
    const e = embeds[i];
    result = result.slice(0, e.start) + (replacements.get(i) ?? '') + result.slice(e.end);
  }
  return result;
}
