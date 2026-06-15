import type { TFile, Component } from 'obsidian';
import { renderBaseEmbeds } from '../src/bases';

function makeFile(path: string): TFile {
  const parts = path.split('/');
  const name = parts[parts.length - 1];
  const basename = name.replace(/\.[^.]+$/, '');
  const parent = parts.length > 1 ? { path: parts.slice(0, -1).join('/') } : null;
  const extension = name.includes('.') ? name.split('.').pop()! : '';
  return { path, name, basename, extension, parent } as unknown as TFile;
}

function makeApp(overrides: { baseFile?: TFile | null } = {}) {
  return {
    metadataCache: {
      getFirstLinkpathDest: jest.fn().mockReturnValue(overrides.baseFile ?? null),
    },
    // embedRegistry intentionally absent: queryBase returns null, the embed is
    // replaced with the placeholder string. This is the only path we can
    // exercise from Node.
  };
}

const noopComponent = { addChild: jest.fn(), removeChild: jest.fn() } as unknown as Component;

describe('renderBaseEmbeds — no embeds', () => {
  afterEach(() => jest.clearAllMocks());

  it('returns markdown unchanged when no .base embeds present', async () => {
    const md = '# Hello\n\nSome text with ![[image.png]] but no base.\n';
    const app = makeApp();
    const file = makeFile('notes/doc.md');

    const result = await renderBaseEmbeds(md, app as any, file, noopComponent);

    expect(result).toBe(md);
    expect(app.metadataCache.getFirstLinkpathDest).not.toHaveBeenCalled();
  });
});

describe('renderBaseEmbeds — embed detection', () => {
  afterEach(() => jest.clearAllMocks());

  it('detects ![[file.base]] and resolves through metadataCache', async () => {
    const baseFile = makeFile('bases/MyBase.base');
    const app = makeApp({ baseFile });
    const noticeSpy = jest.spyOn(require('obsidian'), 'Notice');

    const result = await renderBaseEmbeds(
      '![[MyBase.base]]',
      app as any,
      makeFile('notes/doc.md'),
      noopComponent,
    );

    expect(app.metadataCache.getFirstLinkpathDest)
      .toHaveBeenCalledWith('MyBase.base', 'notes/doc.md');
    // No embedRegistry → queryBase returns null → placeholder substituted.
    expect(result).toContain("Base view 'MyBase.base' not rendered");
    expect(noticeSpy).toHaveBeenCalledWith(expect.stringContaining('Could not render'));
    noticeSpy.mockRestore();
  });

  it('detects ![[file.base#view-name]] (the view name is just passed through)', async () => {
    const baseFile = makeFile('bases/MyBase.base');
    const app = makeApp({ baseFile });

    const result = await renderBaseEmbeds(
      '![[MyBase.base#gepubliceerd]]',
      app as any,
      makeFile('notes/doc.md'),
      noopComponent,
    );

    expect(app.metadataCache.getFirstLinkpathDest)
      .toHaveBeenCalledWith('MyBase.base', 'notes/doc.md');
    expect(result).toContain('not rendered');
  });

  it('shows Notice and uses placeholder when base file not found', async () => {
    const app = makeApp({ baseFile: null });
    const noticeSpy = jest.spyOn(require('obsidian'), 'Notice');

    const result = await renderBaseEmbeds(
      'Before ![[Missing.base]] After',
      app as any,
      makeFile('notes/doc.md'),
      noopComponent,
    );

    expect(result).toContain('[Base not found: Missing.base]');
    expect(result.startsWith('Before ')).toBe(true);
    expect(result.endsWith(' After')).toBe(true);
    expect(noticeSpy).toHaveBeenCalledWith(expect.stringContaining('Base not found'));
    noticeSpy.mockRestore();
  });

  it('handles multiple embeds in one note', async () => {
    const baseFile = makeFile('bases/MyBase.base');
    const app = makeApp({ baseFile });

    const result = await renderBaseEmbeds(
      'First: ![[A.base]]\nSecond: ![[B.base#view]]',
      app as any,
      makeFile('notes/doc.md'),
      noopComponent,
    );

    expect(result).toContain('First:');
    expect(result).toContain('Second:');
    // Both embeds replaced (no original ![[...base]] left).
    expect(result).not.toContain('![[A.base]]');
    expect(result).not.toContain('![[B.base#view]]');
  });
});
