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
    expect(result).toContain('*No results.*');
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
