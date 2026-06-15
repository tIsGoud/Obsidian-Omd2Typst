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

    // Should use 'second' view (file.name column) and return the file row
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

  it('property == "string" matches exact string value using note["prop"] syntax', async () => {
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
    expect(result).toContain('img');
    expect(result).not.toContain('doc');
  });
});

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

    expect(result).toContain('| file name | title | date |');
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
    expect(result).toContain('doc');
    noticeSpy.mockRestore();
  });

  it('renders file.* column headers with "file " prefix (lowercase, space)', async () => {
    const { parseYaml } = require('obsidian');
    parseYaml.mockReturnValue({
      views: [{ type: 'table', name: 'T', order: ['file.name', 'file.path', 'file.ext'] }],
    });
    const f = makeFile('notes/doc.md');
    const caches = new Map([[f.path, makeCache()]]);
    const baseFile = makeFile('base/T.base');
    const app = makeApp({ baseFile, mdFiles: [f], caches });
    const result = await renderBaseEmbeds('![[T.base]]', app as any, makeFile('notes/source.md'));

    expect(result).toContain('| file name | file path | file ext |');
  });

  it('drops columns whose values are empty across every row', async () => {
    const { parseYaml } = require('obsidian');
    parseYaml.mockReturnValue({
      views: [{ type: 'table', name: 'T', order: ['file.name', 'status', 'published'] }],
    });
    const f1 = makeFile('notes/a.md');
    const f2 = makeFile('notes/b.md');
    const caches = new Map([
      [f1.path, makeCache({ status: 'geaccepteerd' })],
      [f2.path, makeCache({ status: 'geaccepteerd' })],
    ]);
    const baseFile = makeFile('base/T.base');
    const app = makeApp({ baseFile, mdFiles: [f1, f2], caches });
    const result = await renderBaseEmbeds('![[T.base]]', app as any, makeFile('notes/doc.md'));

    expect(result).toContain('| file name | status |');
    expect(result).not.toContain('published');
  });

  it('keeps a column when at least one row has a value', async () => {
    const { parseYaml } = require('obsidian');
    parseYaml.mockReturnValue({
      views: [{ type: 'table', name: 'T', order: ['file.name', 'date'] }],
    });
    const f1 = makeFile('notes/a.md');
    const f2 = makeFile('notes/b.md');
    const caches = new Map([
      [f1.path, makeCache({ date: '2024-01-01' })],
      [f2.path, makeCache()],
    ]);
    const baseFile = makeFile('base/T.base');
    const app = makeApp({ baseFile, mdFiles: [f1, f2], caches });
    const result = await renderBaseEmbeds('![[T.base]]', app as any, makeFile('notes/doc.md'));

    expect(result).toContain('| file name | date |');
    expect(result).toContain('2024-01-01');
  });

  it('file.name.endsWith excludes files that end with the suffix', async () => {
    // basenames differ so we can tell them apart in the cell output (which shows basename, not full name)
    const md = makeFile('notes/report.md');
    const pdf = makeFile('notes/photo.pdf');
    const caches = new Map([[md.path, makeCache()], [pdf.path, makeCache()]]);
    const app = makeFilterApp('!file.name.endsWith(".pdf")', [md, pdf], caches);
    const result = await renderBaseEmbeds('![[Test.base]]', app as any, makeFile('notes/doc.md'));
    expect(result).toContain('report');
    expect(result).not.toContain('photo');
  });

  it('file.name.contains matches a substring of the name', async () => {
    const a = makeFile('notes/SAP-ADR-001.md');
    const b = makeFile('notes/other.md');
    const caches = new Map([[a.path, makeCache()], [b.path, makeCache()]]);
    const app = makeFilterApp('file.name.contains("ADR")', [a, b], caches);
    const result = await renderBaseEmbeds('![[Test.base]]', app as any, makeFile('notes/doc.md'));
    expect(result).toContain('SAP-ADR-001');
    expect(result).not.toContain('other');
  });

  it('file.path.endsWith and .contains both work', async () => {
    const a = makeFile('notes/work/widget.md');
    const b = makeFile('notes/home/y.md');
    const caches = new Map([[a.path, makeCache()], [b.path, makeCache()]]);
    const appEnds = makeFilterApp('file.path.endsWith("widget.md")', [a, b], caches);
    expect(await renderBaseEmbeds('![[Test.base]]', appEnds as any, makeFile('notes/doc.md'))).toContain('widget');
    const appContains = makeFilterApp('file.path.contains("work")', [a, b], caches);
    expect(await renderBaseEmbeds('![[Test.base]]', appContains as any, makeFile('notes/doc.md'))).toContain('widget');
  });

  it('!<unsupported> does not exclude every file (match-all in either form)', async () => {
    const a = makeFile('notes/alpha.md');
    const b = makeFile('notes/beta.md');
    const caches = new Map([[a.path, makeCache()], [b.path, makeCache()]]);
    // 'totally.unknown.func()' is not a recognised pattern; negating it must
    // still let every file through, not exclude every file.
    const app = makeFilterApp('!totally.unknown.func()', [a, b], caches);
    const result = await renderBaseEmbeds('![[Test.base]]', app as any, makeFile('notes/doc.md'));
    expect(result).toContain('alpha');
    expect(result).toContain('beta');
  });

  it('defaults to ASC sort by first column when view has no sort', async () => {
    const { parseYaml } = require('obsidian');
    parseYaml.mockReturnValue({
      views: [{ type: 'table', name: 'T', order: ['file.name'] }],
    });
    // Intentionally provide reversed scan order; default sort must rearrange.
    const fz = makeFile('notes/zeta.md');
    const fa = makeFile('notes/alpha.md');
    const caches = new Map([[fz.path, makeCache()], [fa.path, makeCache()]]);
    const baseFile = makeFile('base/T.base');
    const app = makeApp({ baseFile, mdFiles: [fz, fa], caches });
    const result = await renderBaseEmbeds('![[T.base]]', app as any, makeFile('notes/doc.md'));
    expect(result.indexOf('alpha')).toBeLessThan(result.indexOf('zeta'));
  });
});
