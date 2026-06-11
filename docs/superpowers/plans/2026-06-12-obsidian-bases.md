# Obsidian Bases Support — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace `![[file.base]]` embeds with rendered Markdown tables by querying vault frontmatter through Obsidian's metadata cache.

**Architecture:** A new `renderBaseEmbeds()` function in `src/bases.ts` is called from `src/exporter.ts` before `renderMermaidBlocks`. It detects `.base` embeds, reads and parses the `.base` YAML, scans `app.metadataCache` (in-memory, no file I/O), evaluates the filter tree against each note, and replaces each embed with a Markdown pipe table.

**Tech Stack:** TypeScript, Obsidian Plugin API (`App`, `TFile`, `CachedMetadata`, `parseYaml`, `MetadataCache`), Jest

---

## Files

| Action | Path | Purpose |
|--------|------|---------|
| Modify | `src/__mocks__/obsidian.ts` | Add `parseYaml` mock |
| Create | `src/bases.ts` | All bases logic: types, parsing, filtering, querying, table building, `renderBaseEmbeds` |
| Modify | `src/exporter.ts` | Call `renderBaseEmbeds` before `renderMermaidBlocks` |
| Create | `tests/bases.test.ts` | Unit tests for all bases logic |

---

## Task 1: Mock update + types + YAML parsing + embed detection

**Files:**
- Modify: `src/__mocks__/obsidian.ts`
- Create: `src/bases.ts` (partial)
- Create: `tests/bases.test.ts` (partial)

- [ ] **Step 1: Add `parseYaml` to the Obsidian mock**

  In `src/__mocks__/obsidian.ts`, append at the end:

  ```typescript
  export const parseYaml = jest.fn();
  ```

- [ ] **Step 2: Write failing tests for types, YAML parsing, and embed detection**

  Create `tests/bases.test.ts`:

  ```typescript
  import type { CachedMetadata, TFile } from 'obsidian';

  import { renderBaseEmbeds } from '../src/bases';

  function makeFile(path: string): TFile {
    const parts = path.split('/');
    const name = parts[parts.length - 1];
    const basename = name.replace(/\.[^.]+$/, '');
    const parent = parts.length > 1 ? { path: parts.slice(0, -1).join('/') } : null;
    return { path, name, basename, extension: name.includes('.') ? name.split('.').pop()! : '', parent } as unknown as TFile;
  }

  function makeCache(frontmatter: Record<string, unknown> = {}, tags: string[] = []): CachedMetadata {
    return {
      frontmatter: frontmatter as any,
      tags: tags.map(t => ({ tag: t.startsWith('#') ? t : `#${t}` })),
    } as CachedMetadata;
  }

  function makeApp(opts: {
    baseFile?: TFile | null;
    baseContent?: string;
    mdFiles?: TFile[];
    caches?: Map<string, CachedMetadata>;
  } = {}) {
    return {
      metadataCache: {
        getFirstLinkpathDest: jest.fn().mockReturnValue(opts.baseFile ?? null),
        getFileCache: jest.fn().mockImplementation((f: TFile) =>
          opts.caches?.get(f.path) ?? null
        ),
      },
      vault: {
        getMarkdownFiles: jest.fn().mockReturnValue(opts.mdFiles ?? []),
        read: jest.fn().mockResolvedValue(opts.baseContent ?? ''),
      },
    };
  }

  describe('renderBaseEmbeds — no embeds', () => {
    afterEach(() => jest.clearAllMocks());

    it('returns markdown unchanged when no .base embeds present', async () => {
      const md = '# Hello\n\nSome text with ![[image.png]] but no base.\n';
      const app = makeApp();
      const file = makeFile('notes/doc.md');

      const result = await renderBaseEmbeds(md, app as any, file);

      expect(result).toBe(md);
      expect(app.metadataCache.getFirstLinkpathDest).not.toHaveBeenCalled();
    });
  });

  describe('renderBaseEmbeds — embed detection', () => {
    afterEach(() => jest.clearAllMocks());

    it('detects ![[file.base]] without view fragment', async () => {
      const { parseYaml } = require('obsidian');
      parseYaml.mockReturnValue({
        views: [{ type: 'table', name: 'Table', order: ['file.name'] }],
      });
      const baseFile = makeFile('10-System/Bases/MyBase.base');
      const app = makeApp({ baseFile, mdFiles: [], caches: new Map() });
      const file = makeFile('notes/doc.md');

      const result = await renderBaseEmbeds('![[MyBase.base]]', app as any, file);

      expect(app.metadataCache.getFirstLinkpathDest).toHaveBeenCalledWith('MyBase.base', 'notes/doc.md');
      expect(result).toContain('*No results.*');
    });

    it('detects ![[file.base#view-name]] and passes view name', async () => {
      const { parseYaml } = require('obsidian');
      parseYaml.mockReturnValue({
        views: [
          { type: 'table', name: 'first', order: ['file.name'] },
          { type: 'table', name: 'second', order: ['file.name'] },
        ],
      });
      const baseFile = makeFile('bases/MyBase.base');
      const mdFile = makeFile('notes/a.md');
      const caches = new Map([[mdFile.path, makeCache({ title: 'A' })]]);
      const app = makeApp({ baseFile, mdFiles: [mdFile], caches });
      const file = makeFile('notes/doc.md');

      const result = await renderBaseEmbeds('![[MyBase.base#second]]', app as any, file);

      // Should use 'second' view (file.name column)
      expect(result).toContain('a');
    });

    it('shows Notice and uses first view when named view not found', async () => {
      const { parseYaml } = require('obsidian');
      const noticeSpy = jest.spyOn(require('obsidian'), 'Notice');
      parseYaml.mockReturnValue({
        views: [{ type: 'table', name: 'only-view', order: ['file.name'] }],
      });
      const baseFile = makeFile('bases/MyBase.base');
      const app = makeApp({ baseFile, mdFiles: [], caches: new Map() });
      const file = makeFile('notes/doc.md');

      await renderBaseEmbeds('![[MyBase.base#missing]]', app as any, file);

      expect(noticeSpy).toHaveBeenCalledWith(
        expect.stringContaining("View 'missing' not found"),
      );
      noticeSpy.mockRestore();
    });

    it('shows Notice and removes embed when base file not found', async () => {
      const noticeSpy = jest.spyOn(require('obsidian'), 'Notice');
      const app = makeApp({ baseFile: null });
      const file = makeFile('notes/doc.md');

      const result = await renderBaseEmbeds('Before ![[Missing.base]] After', app as any, file);

      expect(result).toBe('Before  After');
      expect(noticeSpy).toHaveBeenCalledWith(expect.stringContaining('Base not found'));
      noticeSpy.mockRestore();
    });

    it('shows Notice and removes embed when YAML cannot be parsed', async () => {
      const { parseYaml } = require('obsidian');
      const noticeSpy = jest.spyOn(require('obsidian'), 'Notice');
      parseYaml.mockImplementation(() => { throw new Error('bad yaml'); });
      const baseFile = makeFile('bases/Bad.base');
      const app = makeApp({ baseFile });
      const file = makeFile('notes/doc.md');

      const result = await renderBaseEmbeds('![[Bad.base]]', app as any, file);

      expect(result).toBe('');
      expect(noticeSpy).toHaveBeenCalledWith(expect.stringContaining('Could not parse'));
      noticeSpy.mockRestore();
    });

    it('shows Notice and removes embed for non-table view type', async () => {
      const { parseYaml } = require('obsidian');
      const noticeSpy = jest.spyOn(require('obsidian'), 'Notice');
      parseYaml.mockReturnValue({
        views: [{ type: 'cards', name: 'Images', order: ['file.name'] }],
      });
      const baseFile = makeFile('bases/Images.base');
      const app = makeApp({ baseFile, mdFiles: [], caches: new Map() });
      const file = makeFile('notes/doc.md');

      const result = await renderBaseEmbeds('![[Images.base]]', app as any, file);

      expect(result).toBe('');
      expect(noticeSpy).toHaveBeenCalledWith(expect.stringContaining("not supported"));
      noticeSpy.mockRestore();
    });
  });
  ```

- [ ] **Step 3: Run tests to confirm they all fail**

  ```bash
  cd /Users/albert/Projects/Omd2Typst@Github/obsidian-omd2typst && npm test -- --testPathPattern=bases 2>&1 | tail -10
  ```

  Expected: all tests fail with `Cannot find module '../src/bases'`.

- [ ] **Step 4: Create `src/bases.ts` with types, parsing, and embed detection**

  ```typescript
  import { App, Notice, TFile, parseYaml } from 'obsidian';
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
  // Stub for future tasks (prevents compile errors)
  // ---------------------------------------------------------------------------

  function evaluateFilter(_filter: BaseFilter, _file: TFile, _cache: CachedMetadata, _skipped: Set<string>): boolean {
    return true;
  }

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
  ```

- [ ] **Step 5: Run tests to confirm Task 1 tests pass**

  ```bash
  cd /Users/albert/Projects/Omd2Typst@Github/obsidian-omd2typst && npm test -- --testPathPattern=bases 2>&1 | tail -10
  ```

  Expected: 6 tests pass (the Task 1 tests).

- [ ] **Step 6: Run full suite**

  ```bash
  cd /Users/albert/Projects/Omd2Typst@Github/obsidian-omd2typst && npm run lint && npm test 2>&1 | tail -6
  ```

  Expected: lint clean, `40 passed` (34 existing + 6 new).

- [ ] **Step 7: Commit**

  ```bash
  cd /Users/albert/Projects/Omd2Typst@Github/obsidian-omd2typst
  git add src/__mocks__/obsidian.ts src/bases.ts tests/bases.test.ts
  git commit -m "feat(bases): types, YAML parsing, embed detection — stubs for filter/query/table"
  ```

---

## Task 2: Filter evaluator

**Files:**
- Modify: `src/bases.ts` (replace `evaluateFilter` stub)
- Modify: `tests/bases.test.ts` (add filter tests)

- [ ] **Step 1: Add filter evaluator tests to `tests/bases.test.ts`**

  Append to `tests/bases.test.ts`:

  ```typescript
  // ---------------------------------------------------------------------------
  // Filter evaluator tests
  // Re-import bases to pick up updated implementation after Task 1 commit.
  // These tests call renderBaseEmbeds with a vault that has specific files,
  // and assert the returned table contains the right rows.
  // ---------------------------------------------------------------------------

  function makeFilterApp(
    filterExpr: string | object,
    mdFiles: TFile[],
    caches: Map<string, CachedMetadata>,
  ) {
    const { parseYaml } = require('obsidian');
    parseYaml.mockReturnValue({
      filters: filterExpr,
      views: [{ type: 'table', name: 'T', order: ['file.name'] }],
    });
    const baseFile = makeFile('base/Test.base');
    return makeApp({ baseFile, mdFiles, caches });
  }

  describe('filter evaluation — file properties', () => {
    afterEach(() => jest.clearAllMocks());

    it('file.ext == "md" includes only .md files', async () => {
      const mdFile = makeFile('notes/hello.md');
      const pngFile = makeFile('assets/img.png');
      const caches = new Map([
        [mdFile.path, makeCache()],
        [pngFile.path, makeCache()],
      ]);
      const app = makeFilterApp('file.ext == "md"', [mdFile, pngFile], caches);
      const result = await renderBaseEmbeds('![[Test.base]]', app as any, makeFile('notes/doc.md'));
      expect(result).toContain('hello');
      expect(result).not.toContain('img');
    });

    it('file.ext != "png" excludes .png files', async () => {
      const mdFile = makeFile('notes/hello.md');
      const pngFile = makeFile('assets/img.png');
      const caches = new Map([
        [mdFile.path, makeCache()],
        [pngFile.path, makeCache()],
      ]);
      const app = makeFilterApp('file.ext != "png"', [mdFile, pngFile], caches);
      const result = await renderBaseEmbeds('![[Test.base]]', app as any, makeFile('notes/doc.md'));
      expect(result).toContain('hello');
      expect(result).not.toContain('img');
    });

    it('file.name.startsWith("SAP-ADR-") matches by prefix', async () => {
      const matching = makeFile('notes/SAP-ADR-001.md');
      const nonMatching = makeFile('notes/other.md');
      const caches = new Map([
        [matching.path, makeCache()],
        [nonMatching.path, makeCache()],
      ]);
      const app = makeFilterApp('file.name.startsWith("SAP-ADR-")', [matching, nonMatching], caches);
      const result = await renderBaseEmbeds('![[Test.base]]', app as any, makeFile('notes/doc.md'));
      expect(result).toContain('SAP-ADR-001');
      expect(result).not.toContain('other');
    });

    it('file.path.startsWith("notes/") matches by path', async () => {
      const inNotes = makeFile('notes/hello.md');
      const inAssets = makeFile('assets/doc.md');
      const caches = new Map([
        [inNotes.path, makeCache()],
        [inAssets.path, makeCache()],
      ]);
      const app = makeFilterApp('file.path.startsWith("notes/")', [inNotes, inAssets], caches);
      const result = await renderBaseEmbeds('![[Test.base]]', app as any, makeFile('notes/doc.md'));
      expect(result).toContain('hello');
      expect(result).not.toContain('doc');
    });

    it('file.tags.contains("excalidraw") matches tagged notes', async () => {
      const tagged = makeFile('notes/diagram.md');
      const plain = makeFile('notes/plain.md');
      const caches = new Map([
        [tagged.path, makeCache({}, ['excalidraw'])],
        [plain.path, makeCache()],
      ]);
      const app = makeFilterApp('file.tags.contains("excalidraw")', [tagged, plain], caches);
      const result = await renderBaseEmbeds('![[Test.base]]', app as any, makeFile('notes/doc.md'));
      expect(result).toContain('diagram');
      expect(result).not.toContain('plain');
    });

    it('file.tags.containsAny("devnetnoord/speaker") matches by tag', async () => {
      const tagged = makeFile('notes/venue.md');
      const plain = makeFile('notes/other.md');
      const caches = new Map([
        [tagged.path, makeCache({}, ['devnetnoord/speaker'])],
        [plain.path, makeCache()],
      ]);
      const app = makeFilterApp('file.tags.containsAny("devnetnoord/speaker")', [tagged, plain], caches);
      const result = await renderBaseEmbeds('![[Test.base]]', app as any, makeFile('notes/doc.md'));
      expect(result).toContain('venue');
      expect(result).not.toContain('other');
    });

    it('!expr negation excludes matching files', async () => {
      const tagged = makeFile('notes/diagram.md');
      const plain = makeFile('notes/plain.md');
      const caches = new Map([
        [tagged.path, makeCache({}, ['excalidraw'])],
        [plain.path, makeCache()],
      ]);
      const app = makeFilterApp('!file.tags.contains("excalidraw")', [tagged, plain], caches);
      const result = await renderBaseEmbeds('![[Test.base]]', app as any, makeFile('notes/doc.md'));
      expect(result).not.toContain('diagram');
      expect(result).toContain('plain');
    });
  });

  describe('filter evaluation — frontmatter properties', () => {
    afterEach(() => jest.clearAllMocks());

    it('property == true matches notes with truthy boolean', async () => {
      const published = makeFile('notes/pub.md');
      const draft = makeFile('notes/draft.md');
      const caches = new Map([
        [published.path, makeCache({ gepubliceerd: true })],
        [draft.path, makeCache({ gepubliceerd: false })],
      ]);
      const app = makeFilterApp('gepubliceerd == true', [published, draft], caches);
      const result = await renderBaseEmbeds('![[Test.base]]', app as any, makeFile('notes/doc.md'));
      expect(result).toContain('pub');
      expect(result).not.toContain('draft');
    });

    it('property != true excludes notes with truthy boolean', async () => {
      const published = makeFile('notes/pub.md');
      const draft = makeFile('notes/draft.md');
      const caches = new Map([
        [published.path, makeCache({ gepubliceerd: true })],
        [draft.path, makeCache({ gepubliceerd: false })],
      ]);
      const app = makeFilterApp('gepubliceerd != true', [published, draft], caches);
      const result = await renderBaseEmbeds('![[Test.base]]', app as any, makeFile('notes/doc.md'));
      expect(result).not.toContain('pub');
      expect(result).toContain('draft');
    });

    it('property == "string" matches exact string value', async () => {
      const wip = makeFile('notes/wip.md');
      const done = makeFile('notes/done.md');
      const caches = new Map([
        [wip.path, makeCache({ 'progress-status': '🚧' })],
        [done.path, makeCache({ 'progress-status': '✅' })],
      ]);
      const app = makeFilterApp('note["progress-status"] == "🚧"', [wip, done], caches);
      const result = await renderBaseEmbeds('![[Test.base]]', app as any, makeFile('notes/doc.md'));
      expect(result).toContain('wip');
      expect(result).not.toContain('done');
    });

    it('property == link("Name") matches [[Name]] in frontmatter', async () => {
      const pres = makeFile('notes/slides.md');
      const other = makeFile('notes/other.md');
      const caches = new Map([
        [pres.path, makeCache({ categories: '[[Presentations]]' })],
        [other.path, makeCache({ categories: '[[Tools]]' })],
      ]);
      const app = makeFilterApp('categories == link("Presentations")', [pres, other], caches);
      const result = await renderBaseEmbeds('![[Test.base]]', app as any, makeFile('notes/doc.md'));
      expect(result).toContain('slides');
      expect(result).not.toContain('other');
    });

    it('and: [...] requires all conditions to match', async () => {
      const both = makeFile('notes/SAP-ADR-001.md');
      const nameOnly = makeFile('notes/SAP-ADR-002.md');
      const tagOnly = makeFile('notes/other.md');
      const caches = new Map([
        [both.path, makeCache({ gepubliceerd: true })],
        [nameOnly.path, makeCache({ gepubliceerd: false })],
        [tagOnly.path, makeCache({ gepubliceerd: true })],
      ]);
      const app = makeFilterApp(
        { and: ['file.name.startsWith("SAP-ADR-")', 'gepubliceerd == true'] },
        [both, nameOnly, tagOnly],
        caches,
      );
      const result = await renderBaseEmbeds('![[Test.base]]', app as any, makeFile('notes/doc.md'));
      expect(result).toContain('SAP-ADR-001');
      expect(result).not.toContain('SAP-ADR-002');
      expect(result).not.toContain('other');
    });

    it('or: [...] requires at least one condition to match', async () => {
      const svg = makeFile('assets/img.svg');
      const png = makeFile('assets/img.png');
      const md = makeFile('notes/doc.md');
      const caches = new Map([
        [svg.path, makeCache()],
        [png.path, makeCache()],
        [md.path, makeCache()],
      ]);
      const app = makeFilterApp(
        { or: ['file.ext == "svg"', 'file.ext == "png"'] },
        [svg, png, md],
        caches,
      );
      const result = await renderBaseEmbeds('![[Test.base]]', app as any, makeFile('notes/doc.md'));
      expect(result).toContain('img.svg'.replace('.svg', ''));
      expect(result).toContain('img.png'.replace('.png', ''));
      expect(result).not.toContain('doc');
    });
  });
  ```

- [ ] **Step 2: Run to confirm new filter tests fail (stubs return `true` for all)**

  ```bash
  cd /Users/albert/Projects/Omd2Typst@Github/obsidian-omd2typst && npm test -- --testPathPattern=bases 2>&1 | grep -E "FAIL|PASS|●" | head -20
  ```

  Expected: several filter tests fail because the stub `evaluateFilter` returns `true` for everything (so excluded items appear in results).

- [ ] **Step 3: Replace `evaluateFilter` stub in `src/bases.ts`**

  Replace:
  ```typescript
  function evaluateFilter(_filter: BaseFilter, _file: TFile, _cache: CachedMetadata, _skipped: Set<string>): boolean {
    return true;
  }
  ```

  With:

  ```typescript
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

    m = /^file\.name\.startsWith\("([^"]+)"\)$/.exec(expr);
    if (m) return file.basename.startsWith(m[1]);

    m = /^file\.ext\s*(==|!=)\s*"([^"]+)"$/.exec(expr);
    if (m) return m[1] === '==' ? file.extension === m[2] : file.extension !== m[2];

    m = /^file\.path\.startsWith\("([^"]+)"\)$/.exec(expr);
    if (m) return file.path.startsWith(m[1]);

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
      const val = fm[prop];
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
      const expr = filter.startsWith('!') ? filter.slice(1).trim() : filter;
      const result = evaluateLeaf(expr, file, cache, skipped);
      return filter.startsWith('!') ? !result : result;
    }
    const node = filter as BaseFilterNode;
    if (node.and) return node.and.every(f => evaluateFilter(f, file, cache, skipped));
    if (node.or) return node.or.some(f => evaluateFilter(f, file, cache, skipped));
    skipped.add(JSON.stringify(filter));
    return true;
  }
  ```

- [ ] **Step 4: Run tests to confirm all pass**

  ```bash
  cd /Users/albert/Projects/Omd2Typst@Github/obsidian-omd2typst && npm test -- --testPathPattern=bases 2>&1 | tail -8
  ```

  Expected: all bases tests pass.

- [ ] **Step 5: Run full suite with lint**

  ```bash
  cd /Users/albert/Projects/Omd2Typst@Github/obsidian-omd2typst && npm run lint && npm test 2>&1 | tail -6
  ```

  Expected: lint clean, all tests pass.

- [ ] **Step 6: Commit**

  ```bash
  cd /Users/albert/Projects/Omd2Typst@Github/obsidian-omd2typst
  git add src/bases.ts tests/bases.test.ts
  git commit -m "feat(bases): filter evaluator — all leaf patterns, and/or/negation"
  ```

---

## Task 3: `queryView`, `cellValue`, and `buildMarkdownTable`

**Files:**
- Modify: `src/bases.ts` (replace stubs)
- Modify: `tests/bases.test.ts` (add table/query tests)

- [ ] **Step 1: Add table and query tests to `tests/bases.test.ts`**

  Append to `tests/bases.test.ts`:

  ```typescript
  describe('table building', () => {
    afterEach(() => jest.clearAllMocks());

    it('builds a markdown pipe table with correct headers and rows', async () => {
      const { parseYaml } = require('obsidian');
      parseYaml.mockReturnValue({
        views: [{ type: 'table', name: 'T', order: ['file.name', 'title', 'date'] }],
      });
      const f1 = makeFile('notes/report.md');
      const f2 = makeFile('notes/memo.md');
      const caches = new Map([
        [f1.path, makeCache({ title: 'Annual Report', date: '2024-01-01' })],
        [f2.path, makeCache({ title: 'Quick Memo', date: '2024-02-01' })],
      ]);
      const baseFile = makeFile('base/T.base');
      const app = makeApp({ baseFile, mdFiles: [f1, f2], caches });
      const result = await renderBaseEmbeds('![[T.base]]', app as any, makeFile('notes/doc.md'));

      expect(result).toContain('| name | title | date |');
      expect(result).toContain('| report | Annual Report | 2024-01-01 |');
      expect(result).toContain('| memo | Quick Memo | 2024-02-01 |');
    });

    it('uses displayName override for column headers', async () => {
      const { parseYaml } = require('obsidian');
      parseYaml.mockReturnValue({
        views: [{ type: 'table', name: 'T', order: ['file.name', 'year'] }],
        properties: { 'file.name': { displayName: 'Lokatie' }, year: { displayName: 'Jaar' } },
      });
      const f = makeFile('notes/venue.md');
      const caches = new Map([[f.path, makeCache({ year: '2024' })]]);
      const baseFile = makeFile('base/T.base');
      const app = makeApp({ baseFile, mdFiles: [f], caches });
      const result = await renderBaseEmbeds('![[T.base]]', app as any, makeFile('notes/doc.md'));

      expect(result).toContain('| Lokatie | Jaar |');
      expect(result).toContain('| venue | 2024 |');
    });

    it('outputs *No results.* when query returns zero rows', async () => {
      const { parseYaml } = require('obsidian');
      parseYaml.mockReturnValue({
        filters: 'file.ext == "nonexistent"',
        views: [{ type: 'table', name: 'T', order: ['file.name'] }],
      });
      const f = makeFile('notes/doc.md');
      const caches = new Map([[f.path, makeCache()]]);
      const baseFile = makeFile('base/T.base');
      const app = makeApp({ baseFile, mdFiles: [f], caches });
      const result = await renderBaseEmbeds('![[T.base]]', app as any, makeFile('notes/source.md'));

      expect(result).toBe('*No results.*');
    });

    it('strips [[Link]] syntax from cell values', async () => {
      const { parseYaml } = require('obsidian');
      parseYaml.mockReturnValue({
        views: [{ type: 'table', name: 'T', order: ['file.name', 'categories'] }],
      });
      const f = makeFile('notes/slides.md');
      const caches = new Map([[f.path, makeCache({ categories: '[[Presentations]]' })]]);
      const baseFile = makeFile('base/T.base');
      const app = makeApp({ baseFile, mdFiles: [f], caches });
      const result = await renderBaseEmbeds('![[T.base]]', app as any, makeFile('notes/doc.md'));

      expect(result).toContain('Presentations');
      expect(result).not.toContain('[[');
    });

    it('applies sort in specified direction', async () => {
      const { parseYaml } = require('obsidian');
      parseYaml.mockReturnValue({
        views: [{
          type: 'table',
          name: 'T',
          order: ['file.name'],
          sort: [{ property: 'file.name', direction: 'ASC' }],
        }],
      });
      const fa = makeFile('notes/alpha.md');
      const fz = makeFile('notes/zeta.md');
      const caches = new Map([[fa.path, makeCache()], [fz.path, makeCache()]]);
      const baseFile = makeFile('base/T.base');
      const app = makeApp({ baseFile, mdFiles: [fz, fa], caches }); // intentionally reversed
      const result = await renderBaseEmbeds('![[T.base]]', app as any, makeFile('notes/doc.md'));

      const alphaPos = result.indexOf('alpha');
      const zetaPos = result.indexOf('zeta');
      expect(alphaPos).toBeLessThan(zetaPos);
    });

    it('emits Notice for unsupported filter expression and still queries', async () => {
      const { parseYaml } = require('obsidian');
      const noticeSpy = jest.spyOn(require('obsidian'), 'Notice');
      parseYaml.mockReturnValue({
        filters: 'unsupported.function("xyz")',
        views: [{ type: 'table', name: 'T', order: ['file.name'] }],
      });
      const f = makeFile('notes/doc.md');
      const caches = new Map([[f.path, makeCache()]]);
      const baseFile = makeFile('base/T.base');
      const app = makeApp({ baseFile, mdFiles: [f], caches });
      const result = await renderBaseEmbeds('![[T.base]]', app as any, makeFile('notes/source.md'));

      expect(noticeSpy).toHaveBeenCalledWith(expect.stringContaining('Unsupported filter'));
      expect(result).toContain('doc'); // file still included (unsupported = match all)
      noticeSpy.mockRestore();
    });
  });
  ```

- [ ] **Step 2: Run to confirm new tests fail**

  ```bash
  cd /Users/albert/Projects/Omd2Typst@Github/obsidian-omd2typst && npm test -- --testPathPattern=bases 2>&1 | grep "●" | head -10
  ```

  Expected: table building tests fail because `cellValue` and `queryView` stubs return empty strings and empty arrays.

- [ ] **Step 3: Replace `cellValue`, `queryView`, and `buildMarkdownTable` stubs in `src/bases.ts`**

  Replace:
  ```typescript
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
  ```

  With:

  ```typescript
  function formatValue(val: unknown): string {
    if (val === null || val === undefined) return '';
    const s = String(val);
    return s.replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (_, name: string, alias: string | undefined) => alias ?? name);
  }

  function cellValue(col: string, file: TFile, cache: CachedMetadata): string {
    const fm: FrontMatterCache = cache.frontmatter ?? {};
    if (col === 'file.name') return file.basename;
    if (col === 'file.path') return file.path;
    if (col === 'file.ext') return file.extension;
    if (col === 'file.tags') return (cache.tags ?? []).map(t => t.tag.replace(/^#/, '')).join(', ');
    const prop = normalizePropertyName(col);
    const val = fm[prop];
    if (Array.isArray(val)) return val.map(formatValue).join(', ');
    return formatValue(val);
  }

  async function queryView(
    base: BaseDefinition,
    view: BaseView,
    app: App,
  ): Promise<{ rows: Record<string, string>[]; skippedFilters: Set<string> }> {
    const skipped = new Set<string>();
    const files = app.vault.getMarkdownFiles();
    const rows: Record<string, string>[] = [];

    for (const file of files) {
      const cache = app.metadataCache.getFileCache(file);
      if (!cache) continue;
      if (base.filters && !evaluateFilter(base.filters, file, cache, skipped)) continue;
      if (view.filters && !evaluateFilter(view.filters, file, cache, skipped)) continue;

      const columns = view.order ?? ['file.name'];
      const row: Record<string, string> = {};
      for (const col of columns) row[col] = cellValue(col, file, cache);
      rows.push(row);
    }

    if (view.sort) {
      for (const s of [...view.sort].reverse()) {
        rows.sort((a, b) => {
          const cmp = (a[s.property] ?? '').localeCompare(b[s.property] ?? '');
          return s.direction === 'DESC' ? -cmp : cmp;
        });
      }
    }

    return { rows, skippedFilters: skipped };
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
  ```

- [ ] **Step 4: Run all bases tests**

  ```bash
  cd /Users/albert/Projects/Omd2Typst@Github/obsidian-omd2typst && npm test -- --testPathPattern=bases 2>&1 | tail -10
  ```

  Expected: all bases tests pass.

- [ ] **Step 5: Run full suite with lint**

  ```bash
  cd /Users/albert/Projects/Omd2Typst@Github/obsidian-omd2typst && npm run lint && npm test 2>&1 | tail -6
  ```

  Expected: lint clean, all tests pass.

- [ ] **Step 6: Commit**

  ```bash
  cd /Users/albert/Projects/Omd2Typst@Github/obsidian-omd2typst
  git add src/bases.ts tests/bases.test.ts
  git commit -m "feat(bases): cellValue, queryView, buildMarkdownTable"
  ```

---

## Task 4: Wire `renderBaseEmbeds` into `src/exporter.ts`

**Files:**
- Modify: `src/exporter.ts`

- [ ] **Step 1: Add import and call in `src/exporter.ts`**

  Add after the existing imports at the top of `src/exporter.ts`:

  ```typescript
  import { renderBaseEmbeds } from './bases';
  ```

  Then replace the Step 1 block in `exportNote`:

  Replace:
  ```typescript
    // Step 1: Read and pre-process the note (renders mermaid blocks to temp SVGs)
    const rawMarkdown = await app.vault.read(file);
    const { markdown, cleanup } = await renderMermaidBlocks(rawMarkdown, app, file);
  ```

  With:
  ```typescript
    // Step 1: Read and pre-process the note
    const rawMarkdown = await app.vault.read(file);
    const markdownAfterBases = await renderBaseEmbeds(rawMarkdown, app, file);
    const { markdown, cleanup } = await renderMermaidBlocks(markdownAfterBases, app, file);
  ```

- [ ] **Step 2: Run lint and full test suite**

  ```bash
  cd /Users/albert/Projects/Omd2Typst@Github/obsidian-omd2typst && npm run lint && npm test 2>&1 | tail -6
  ```

  Expected: lint clean, all tests pass. Existing exporter tests are unaffected — their markdown has no `.base` embeds so `renderBaseEmbeds` returns it unchanged.

- [ ] **Step 3: Build to confirm compilation**

  ```bash
  cd /Users/albert/Projects/Omd2Typst@Github/obsidian-omd2typst && node esbuild.config.mjs production 2>&1
  ```

  Expected: `main.js  ~1.8mb` with no errors.

- [ ] **Step 4: Commit**

  ```bash
  cd /Users/albert/Projects/Omd2Typst@Github/obsidian-omd2typst
  git add src/exporter.ts
  git commit -m "feat(bases): wire renderBaseEmbeds into export pipeline"
  ```

---

## Task 5: Release plugin v0.8.20

**Files:**
- Modify: `manifest.json`
- Modify: `package.json`
- Modify: `RELEASE_NOTES.md`

- [ ] **Step 1: Bump versions**

  In `manifest.json`, change `"version": "0.8.19"` to `"version": "0.8.20"`.
  In `package.json`, change `"version": "0.8.19"` to `"version": "0.8.20"`.

- [ ] **Step 2: Add release notes**

  Prepend after the `# Release Notes` heading:

  ```markdown
  ## v0.8.20 — Obsidian Bases support

  Notes that embed an Obsidian Bases view (`![[file.base]]` or `![[file.base#view-name]]`)
  now render the query results as a table in exported PDFs and `.typ` files.

  - Results are queried from Obsidian's in-memory metadata cache — no extra tools required.
  - Supported filter operations: `file.ext`, `file.name.startsWith()`, `file.path.startsWith()`,
    `file.tags.contains()`, `file.tags.containsAny()`, property equality/inequality,
    `link()` comparisons, `and`/`or`/`!` boolean operators.
  - Column headers and display names are read from the `.base` file's `properties` section.
  - Only `table` view types are supported; `cards`, `calendar`, and `gallery` views are skipped
    with a notice.
  - Unsupported filter expressions are skipped (treated as matching all files) with a notice.
  - Use `![[file.base#view-name]]` to select a specific named view; defaults to the first view.

  ---
  ```

- [ ] **Step 3: Commit, tag, and push**

  ```bash
  cd /Users/albert/Projects/Omd2Typst@Github/obsidian-omd2typst
  git add manifest.json package.json RELEASE_NOTES.md
  git commit -m "v0.8.20 — Obsidian Bases support"
  git tag 0.8.20
  git push && git push --tags
  ```
