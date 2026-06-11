import { App, Notice, TFile, parseYaml } from 'obsidian';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type { CachedMetadata, FrontMatterCache } from 'obsidian';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type BaseFilter = string | BaseFilterNode;

interface BaseFilterNode {
  and?: BaseFilter[];
  or?: BaseFilter[];
}

interface BaseView {
  type: string;
  name: string;
  filters?: BaseFilter;
  order?: string[];
  sort?: Array<{ property: string; direction: 'ASC' | 'DESC' }>;
}

interface BaseDefinition {
  filters?: BaseFilter;
  views: BaseView[];
  properties?: Record<string, { displayName?: string }>;
}

// ---------------------------------------------------------------------------
// Parsing and detection
// ---------------------------------------------------------------------------

function parseBaseFile(content: string): BaseDefinition {
  const parsed = parseYaml(content) as Record<string, unknown>;
  return {
    filters: parsed.filters as BaseFilter | undefined,
    views: (parsed.views as BaseView[]) ?? [],
    properties: (parsed.properties as Record<string, { displayName?: string }>) ?? {},
  };
}

function detectBaseEmbeds(markdown: string): Array<{
  full: string; start: number; end: number; path: string; viewName: string | undefined;
}> {
  const re = /!\[\[([^\]#|]+\.base)(?:#([^\]|]+))?\]\]/g;
  const results: Array<{ full: string; start: number; end: number; path: string; viewName: string | undefined }> = [];
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

function resolveView(
  base: BaseDefinition,
  baseName: string,
  viewName: string | undefined,
): BaseView {
  if (viewName === undefined) return base.views[0];
  const found = base.views.find(v => v.name === viewName);
  if (found) return found;
  new Notice(`View '${viewName}' not found in ${baseName} — using first view`);
  return base.views[0];
}

function columnHeader(col: string, base: BaseDefinition): string {
  const displayName = base.properties?.[col]?.displayName;
  if (displayName) return displayName;
  return col.startsWith('file.') ? col.slice(5) : col;
}

// ---------------------------------------------------------------------------
// Stubs — replaced in Tasks 2 and 3
// ---------------------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function evaluateFilter(_filter: BaseFilter, _file: TFile, _cache: CachedMetadata, _skipped: Set<string>): boolean {
  return true;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function cellValue(_col: string, _file: TFile, _cache: CachedMetadata): string {
  return '';
}

async function queryView(
  _base: BaseDefinition,
  _view: BaseView,
  _app: App,
): Promise<{ rows: Record<string, string>[]; skippedFilters: Set<string> }> {
  return { rows: [], skippedFilters: new Set() };
}

function buildMarkdownTable(
  rows: Record<string, string>[],
  columns: string[],
  base: BaseDefinition,
): string {
  const headers = columns.map(c => columnHeader(c, base));
  const separator = columns.map(() => '----');
  const headerRows = [
    `| ${headers.join(' | ')} |`,
    `| ${separator.join(' | ')} |`,
  ];
  if (rows.length === 0) return [...headerRows, '*No results.*'].join('\n');
  const dataRows = rows.map(row => columns.map(c => row[c] ?? ''));
  return [
    ...headerRows,
    ...dataRows.map(r => `| ${r.join(' | ')} |`),
  ].join('\n');
}

// ---------------------------------------------------------------------------
// Main exported function
// ---------------------------------------------------------------------------

export async function renderBaseEmbeds(
  markdown: string,
  app: App,
  noteFile: TFile,
): Promise<string> {
  const embeds = detectBaseEmbeds(markdown);
  if (embeds.length === 0) return markdown;

  const allSkipped = new Set<string>();
  const replacements = new Map<number, string>();

  for (let i = 0; i < embeds.length; i++) {
    const embed = embeds[i];
    const baseName = embed.path.split('/').pop() ?? embed.path;

    const baseFile = app.metadataCache.getFirstLinkpathDest(embed.path, noteFile.path);
    if (!baseFile) {
      new Notice(`Base not found: ${baseName}`);
      replacements.set(i, '');
      continue;
    }

    let base: BaseDefinition;
    try {
      const content = await app.vault.read(baseFile);
      base = parseBaseFile(content);
    } catch {
      new Notice(`Could not parse ${baseName}`);
      replacements.set(i, '');
      continue;
    }

    if (!base.views || base.views.length === 0) {
      new Notice(`No views defined in ${baseName}`);
      replacements.set(i, '');
      continue;
    }

    const view = resolveView(base, baseName, embed.viewName);

    if (view.type !== 'table') {
      new Notice(`View type '${view.type}' in ${baseName} is not supported — only table views are exported`);
      replacements.set(i, '');
      continue;
    }

    const { rows, skippedFilters } = await queryView(base, view, app);
    skippedFilters.forEach(s => allSkipped.add(s));

    const columns = view.order ?? ['file.name'];
    replacements.set(i, buildMarkdownTable(rows, columns, base));
  }

  if (allSkipped.size > 0) {
    new Notice(`Unsupported filter expressions skipped: ${[...allSkipped].join(', ')}`);
  }

  let result = markdown;
  for (let i = embeds.length - 1; i >= 0; i--) {
    const embed = embeds[i];
    const replacement = replacements.get(i) ?? '';
    result = result.slice(0, embed.start) + replacement + result.slice(embed.end);
  }

  return result;
}
