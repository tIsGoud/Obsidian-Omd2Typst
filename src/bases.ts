import { App, Component, MarkdownRenderer, Notice, TFile, parseYaml } from 'obsidian';
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
  if (col.startsWith('file.')) return 'file ' + col.slice(5);
  return col;
}

// ---------------------------------------------------------------------------
// Filter evaluation
// ---------------------------------------------------------------------------

function normalizePropertyName(prop: string): string {
  const bracketMatch = /^note\["([^"]+)"\]$/.exec(prop);
  if (bracketMatch) return bracketMatch[1];
  if (prop.startsWith('note.')) return prop.slice(5);
  return prop;
}

function evaluateLeaf(
  expr: string,
  file: TFile,
  cache: CachedMetadata,
  skipped: Set<string>,
): boolean {
  const fm: FrontMatterCache = cache.frontmatter ?? {};
  const tags = (cache.tags ?? []).map(t => t.tag.replace(/^#/, ''));
  let m: RegExpExecArray | null;

  // file.name / file.path use the full filename (with extension), matching
  // Obsidian's Bases convention.

  m = /^file\.name\.startsWith\("([^"]+)"\)$/.exec(expr);
  if (m) return file.name.startsWith(m[1]);

  m = /^file\.name\.endsWith\("([^"]+)"\)$/.exec(expr);
  if (m) return file.name.endsWith(m[1]);

  m = /^file\.name\.contains\("([^"]+)"\)$/.exec(expr);
  if (m) return file.name.includes(m[1]);

  m = /^file\.ext\s*(==|!=)\s*"([^"]+)"$/.exec(expr);
  if (m) return m[1] === '==' ? file.extension === m[2] : file.extension !== m[2];

  m = /^file\.path\.startsWith\("([^"]+)"\)$/.exec(expr);
  if (m) return file.path.startsWith(m[1]);

  m = /^file\.path\.endsWith\("([^"]+)"\)$/.exec(expr);
  if (m) return file.path.endsWith(m[1]);

  m = /^file\.path\.contains\("([^"]+)"\)$/.exec(expr);
  if (m) return file.path.includes(m[1]);

  m = /^file\.tags\.contains\("([^"]+)"\)$/.exec(expr);
  if (m) return tags.includes(m[1]);

  m = /^file\.tags\.containsAny\("([^"]+)"\)$/.exec(expr);
  if (m) {
    const target = m[1];
    return tags.some(t => t === target || t.startsWith(target + '/'));
  }

  m = /^(.+?)\s*==\s*(true|false)$/.exec(expr);
  if (m) {
    const prop = normalizePropertyName(m[1].trim());
    const val = m[2] === 'true';
    return fm[prop] === val || fm[prop] === String(val);
  }

  m = /^(.+?)\s*!=\s*(true|false)$/.exec(expr);
  if (m) {
    const prop = normalizePropertyName(m[1].trim());
    const val = m[2] === 'true';
    return fm[prop] !== val && fm[prop] !== String(val);
  }

  m = /^(.+?)\s*==\s*link\("([^"]+)"\)$/.exec(expr);
  if (m) {
    const prop = normalizePropertyName(m[1].trim());
    const linkName = m[2];
    const val: unknown = fm[prop];
    const containsLink = (s: string) =>
      s.includes(`[[${linkName}]]`) || s.includes(`[[${linkName}|`);
    if (typeof val === 'string') return containsLink(val);
    if (Array.isArray(val)) return val.some(v => typeof v === 'string' && containsLink(v));
    return false;
  }

  m = /^(.+?)\s*==\s*"([^"]*)"$/.exec(expr);
  if (m) {
    const prop = normalizePropertyName(m[1].trim());
    return String(fm[prop] ?? '') === m[2];
  }

  m = /^(.+?)\s*!=\s*"([^"]*)"$/.exec(expr);
  if (m) {
    const prop = normalizePropertyName(m[1].trim());
    return String(fm[prop] ?? '') !== m[2];
  }

  skipped.add(expr);
  return true;
}

function evaluateFilter(
  filter: BaseFilter,
  file: TFile,
  cache: CachedMetadata,
  skipped: Set<string>,
): boolean {
  if (typeof filter === 'string') {
    const negated = filter.startsWith('!');
    const expr = negated ? filter.slice(1).trim() : filter;
    const result = evaluateLeaf(expr, file, cache, skipped);
    // Unsupported expression: treat as match-all in BOTH positive and negative
    // form. Without this guard `!unsupported` would silently exclude every
    // file (the previous bug), which is the worst possible default. We can't
    // use a size delta because Set.add is idempotent across iterations.
    if (skipped.has(expr)) return true;
    return negated ? !result : result;
  }
  const node = filter;
  if (node.and) return node.and.every(f => evaluateFilter(f, file, cache, skipped));
  if (node.or) return node.or.some(f => evaluateFilter(f, file, cache, skipped));
  skipped.add(JSON.stringify(filter));
  return true;
}

function stripLinks(value: string): string {
  return value.replace(/\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/g, '$1');
}

function cellValue(col: string, file: TFile, cache: CachedMetadata): string {
  const fm: FrontMatterCache = cache.frontmatter ?? {};
  if (col === 'file.name') return file.basename;
  if (col === 'file.path') return file.path;
  if (col === 'file.ext') return file.extension;
  if (col === 'file.tags') return (cache.tags ?? []).map(t => t.tag.replace(/^#/, '')).join(', ');
  const prop = normalizePropertyName(col);
  const val: unknown = fm[prop];
  if (val === null || val === undefined) return '';
  if (Array.isArray(val)) return val.map(v => stripLinks(String(v))).join(', ');
  // eslint-disable-next-line @typescript-eslint/no-base-to-string -- frontmatter scalars (string/number/boolean/date) produce sensible strings via String(); null/undefined and arrays handled above
  return stripLinks(String(val));
}

async function queryView(
  base: BaseDefinition,
  view: BaseView,
  app: App,
): Promise<{ rows: Record<string, string>[]; skippedFilters: Set<string> }> {
  const skippedFilters = new Set<string>();
  const allFiles: TFile[] = app.vault.getMarkdownFiles();
  const columns = view.order ?? ['file.name'];

  const rows: Record<string, string>[] = [];
  for (const file of allFiles) {
    const cache: CachedMetadata = app.metadataCache.getFileCache(file) ?? { frontmatter: {} };

    const globalFilter = base.filters;
    if (globalFilter && !evaluateFilter(globalFilter, file, cache, skippedFilters)) continue;

    const viewFilter = view.filters;
    if (viewFilter && !evaluateFilter(viewFilter, file, cache, skippedFilters)) continue;

    const row: Record<string, string> = {};
    for (const col of columns) {
      row[col] = cellValue(col, file, cache);
    }
    rows.push(row);
  }

  if (view.sort && view.sort.length > 0) {
    rows.sort((a, b) => {
      for (const { property, direction } of view.sort!) {
        const av = a[property] ?? '';
        const bv = b[property] ?? '';
        const cmp = av.localeCompare(bv);
        if (cmp !== 0) return direction === 'DESC' ? -cmp : cmp;
      }
      return 0;
    });
  } else {
    // No explicit sort: default to ASC by the first column, matching Obsidian's
    // table-view default. Without this rows would appear in vault scan order.
    const firstCol = (view.order ?? ['file.name'])[0];
    rows.sort((a, b) => (a[firstCol] ?? '').localeCompare(b[firstCol] ?? ''));
  }

  return { rows, skippedFilters };
}

function buildMarkdownTable(
  rows: Record<string, string>[],
  columns: string[],
  base: BaseDefinition,
): string {
  if (rows.length === 0) return '*No results.*';
  const headers = columns.map(c => columnHeader(c, base));
  const separator = columns.map(() => '----');
  const dataRows = rows.map(row => columns.map(c => row[c] ?? ''));
  return [
    `| ${headers.join(' | ')} |`,
    `| ${separator.join(' | ')} |`,
    ...dataRows.map(r => `| ${r.join(' | ')} |`),
  ].join('\n');
}

// ---------------------------------------------------------------------------
// Path A: render the embed via Obsidian's own engine, then read the DOM table
// ---------------------------------------------------------------------------

/**
 * Render a single `![[file.base#view]]` embed through Obsidian's MarkdownRenderer
 * into a detached DOM element, wait for Obsidian's query engine to populate the
 * table, and return the headers + rows captured from the rendered `<table>`.
 *
 * Returns null on failure (timeout, no table produced, exception). Callers should
 * fall back to the local evaluator.
 */
async function tryRenderViaObsidian(
  app: App,
  noteFile: TFile,
  embedPath: string,
  viewName: string | undefined,
  parent: Component,
): Promise<{ headers: string[]; rows: string[][] } | null> {
  const hiddenEl = activeDocument.createElement('div');
  hiddenEl.addClass('omd2typst-bases-headless');
  activeDocument.body.appendChild(hiddenEl);

  const tmpComp = new Component();
  parent.addChild(tmpComp);

  try {
    const subpath = viewName ? `#${viewName}` : '';
    const embedMd = `![[${embedPath}${subpath}]]`;
    await MarkdownRenderer.render(app, embedMd, hiddenEl, noteFile.path, tmpComp);

    // Bases queries are async + batched. Poll for a populated <table> with a
    // short stable-state window so we don't read mid-render.
    const deadline = Date.now() + 5000;
    let lastSignature = '';
    let stableCount = 0;
    let table: HTMLTableElement | null = null;

    while (Date.now() < deadline) {
      table = hiddenEl.querySelector('table');
      const sig = table ? `${table.rows.length}:${table.textContent?.length ?? 0}` : '';
      if (sig && sig === lastSignature) {
        stableCount++;
        if (stableCount >= 3) break; // ~150ms stable
      } else {
        stableCount = 0;
        lastSignature = sig;
      }
      await new Promise(r => window.setTimeout(r, 50));
    }

    if (!table || table.rows.length === 0) return null;

    const headerCells = Array.from(table.rows[0].cells);
    const headers = headerCells.map(c => (c.textContent ?? '').trim());
    const rows = Array.from(table.rows).slice(1).map(row =>
      Array.from(row.cells).map(c => (c.textContent ?? '').trim()),
    );
    return { headers, rows };
  } catch (err) {
    console.error('[omd2typst] tryRenderViaObsidian failed:', err);
    return null;
  } finally {
    parent.removeChild(tmpComp);
    hiddenEl.remove();
  }
}

function buildTableFromHeaders(headers: string[], rows: string[][]): string {
  if (rows.length === 0) return '*No results.*';
  const separator = headers.map(() => '----');
  return [
    `| ${headers.join(' | ')} |`,
    `| ${separator.join(' | ')} |`,
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
  parent?: Component,
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

    // Path A: try Obsidian's own renderer first. Captures the rendered <table>
    // so we get full filter-language support for free.
    if (parent) {
      const captured = await tryRenderViaObsidian(app, noteFile, embed.path, embed.viewName, parent);
      if (captured) {
        replacements.set(i, buildTableFromHeaders(captured.headers, captured.rows));
        continue;
      }
      // Falls through to the local evaluator on failure.
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

    if (!view) {
      new Notice(`First view in ${baseName} is invalid`);
      replacements.set(i, '');
      continue;
    }

    if (view.type !== 'table') {
      new Notice(`View type '${view.type}' in ${baseName} is not supported — only table views are exported`);
      replacements.set(i, '');
      continue;
    }

    const { rows, skippedFilters } = await queryView(base, view, app);
    skippedFilters.forEach(s => allSkipped.add(s));

    // Match Obsidian's display: drop columns whose values are empty across every row.
    const allColumns = view.order ?? ['file.name'];
    const nonEmpty = allColumns.filter(col =>
      rows.some(row => row[col] !== undefined && row[col] !== ''),
    );
    const columns = nonEmpty.length > 0 ? nonEmpty : allColumns;
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
