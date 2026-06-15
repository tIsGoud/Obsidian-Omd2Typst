import { renderMermaidBlocks, extractMermaidTitle } from '../src/mermaid';
import type { TFile } from 'obsidian';

function makeFile(path: string): TFile {
  const parts = path.split('/');
  const name = parts[parts.length - 1];
  const basename = name.replace(/\.[^.]+$/, '');
  const parent = parts.length > 1 ? { path: parts.slice(0, -1).join('/') } : null;
  return { path, name, basename, extension: 'md', parent } as unknown as TFile;
}

function makeApp() {
  return {
    vault: {
      adapter: {
        write: jest.fn().mockResolvedValue(undefined),
        remove: jest.fn().mockResolvedValue(undefined),
      },
    },
  };
}

function makeMermaid(renderImpl?: jest.Mock) {
  return {
    initialize: jest.fn(),
    render: renderImpl ?? jest.fn().mockResolvedValue({ svg: '<svg>diagram</svg>' }),
  };
}

describe('renderMermaidBlocks', () => {
  beforeEach(() => { (global as any).window = {}; });
  afterEach(() => { delete (global as any).window; jest.clearAllMocks(); });

  it('returns markdown unchanged when no mermaid blocks present', async () => {
    const md = '# Hello\n\nSome text\n\n```typescript\nconst x = 1;\n```\n';
    const app = makeApp();
    const file = makeFile('notes/doc.md');

    const { markdown, cleanup } = await renderMermaidBlocks(md, app as any, file);

    expect(markdown).toBe(md);
    expect(app.vault.adapter.write).not.toHaveBeenCalled();
    await cleanup();
    expect(app.vault.adapter.remove).not.toHaveBeenCalled();
  });

  it('replaces a single mermaid block with a vault-relative image reference', async () => {
    const md = '# Doc\n\n```mermaid\ngraph TD\n  A --> B\n```\n\nEnd\n';
    const app = makeApp();
    const file = makeFile('notes/doc.md');
    (global as any).window.mermaid = makeMermaid();

    const { markdown, cleanup } = await renderMermaidBlocks(md, app as any, file);

    expect(markdown).toContain('![](<notes/doc-mermaid-0.svg>)');
    expect(markdown).not.toContain('```mermaid');
    expect(app.vault.adapter.write).toHaveBeenCalledWith(
      'notes/doc-mermaid-0.svg',
      '<svg>diagram</svg>',
    );
    await cleanup();
    expect(app.vault.adapter.remove).toHaveBeenCalledWith('notes/doc-mermaid-0.svg');
  });

  it('assigns indexed filenames to multiple mermaid blocks', async () => {
    const md = '```mermaid\ngraph TD\n  A-->B\n```\n\nText\n\n```mermaid\nsequenceDiagram\n  A->>B: hi\n```\n';
    const app = makeApp();
    const file = makeFile('notes/doc.md');
    (global as any).window.mermaid = makeMermaid();

    const { markdown } = await renderMermaidBlocks(md, app as any, file);

    expect(markdown).toContain('![](<notes/doc-mermaid-0.svg>)');
    expect(markdown).toContain('![](<notes/doc-mermaid-1.svg>)');
    expect(app.vault.adapter.write).toHaveBeenCalledTimes(2);
  });

  it('returns original markdown and shows Notice when window.mermaid is absent', async () => {
    const md = '```mermaid\ngraph TD\n  A-->B\n```\n';
    const app = makeApp();
    const file = makeFile('notes/doc.md');
    // window exists but mermaid is not on it
    const noticeSpy = jest.spyOn(require('obsidian'), 'Notice');

    const { markdown } = await renderMermaidBlocks(md, app as any, file);

    expect(markdown).toBe(md);
    expect(app.vault.adapter.write).not.toHaveBeenCalled();
    expect(noticeSpy).toHaveBeenCalledWith(
      expect.stringContaining('Mermaid library was not found'),
    );
    noticeSpy.mockRestore();
  });

  it('leaves a failing block as code listing and shows Notice; other blocks still render', async () => {
    const md = '```mermaid\nbad diagram\n```\n\nText\n\n```mermaid\ngraph TD\n  A-->B\n```\n';
    const app = makeApp();
    const file = makeFile('notes/doc.md');
    (global as any).window.mermaid = makeMermaid(
      jest.fn()
        .mockRejectedValueOnce(new Error('parse error'))
        .mockResolvedValueOnce({ svg: '<svg>ok</svg>' }),
    );
    const noticeSpy = jest.spyOn(require('obsidian'), 'Notice');

    const { markdown } = await renderMermaidBlocks(md, app as any, file);

    expect(markdown).toContain('```mermaid\nbad diagram\n```');
    expect(markdown).toContain('![](<notes/doc-mermaid-1.svg>)');
    expect(noticeSpy).toHaveBeenCalledWith(
      expect.stringContaining('diagram 1 could not be rendered'),
    );
    noticeSpy.mockRestore();
  });

  it('wraps image path in angle brackets so spaces in note titles parse correctly', async () => {
    const md = '```mermaid\ngraph TD\n  A-->B\n```\n';
    const app = makeApp();
    const file = makeFile('input/mimimal mermaid.md');
    (global as any).window.mermaid = makeMermaid();

    const { markdown } = await renderMermaidBlocks(md, app as any, file);

    // Path has a space, so the markdown image ref must use angle-bracket form.
    expect(markdown).toContain('![](<input/mimimal mermaid-mermaid-0.svg>)');
    expect(app.vault.adapter.write).toHaveBeenCalledWith(
      'input/mimimal mermaid-mermaid-0.svg',
      '<svg>diagram</svg>',
    );
  });

  it('uses mermaid title frontmatter as image alt (becomes Typst caption)', async () => {
    const md = '```mermaid\n---\ntitle: GitGraph example\n---\ngitGraph\n  commit\n```\n';
    const app = makeApp();
    const file = makeFile('notes/doc.md');
    const renderFn = jest.fn().mockResolvedValue({ svg: '<svg>x</svg>' });
    (global as any).window.mermaid = makeMermaid(renderFn);

    const { markdown } = await renderMermaidBlocks(md, app as any, file);

    // Image ref carries the title as alt text → Typst figure caption.
    expect(markdown).toContain('![GitGraph example](<notes/doc-mermaid-0.svg>)');
    // The source sent to mermaid had the title frontmatter stripped.
    expect(renderFn).toHaveBeenCalledWith(
      expect.any(String),
      'gitGraph\n  commit\n',
    );
  });

  it('emits empty alt when no mermaid title is present', async () => {
    const md = '```mermaid\ngraph TD\n  A-->B\n```\n';
    const app = makeApp();
    const file = makeFile('notes/doc.md');
    (global as any).window.mermaid = makeMermaid();

    const { markdown } = await renderMermaidBlocks(md, app as any, file);

    expect(markdown).toContain('![](<notes/doc-mermaid-0.svg>)');
  });
});

describe('extractMermaidTitle', () => {
  it('returns null title and unchanged source when no frontmatter present', () => {
    const src = 'graph TD\n  A-->B\n';
    expect(extractMermaidTitle(src)).toEqual({ title: null, cleanSource: src });
  });

  it('extracts title and strips the entire frontmatter when title is the only key', () => {
    const src = '---\ntitle: My title\n---\ngraph TD\n  A-->B\n';
    expect(extractMermaidTitle(src)).toEqual({
      title: 'My title',
      cleanSource: 'graph TD\n  A-->B\n',
    });
  });

  it('preserves other frontmatter keys, removing only the title line', () => {
    const src = '---\ntitle: My title\nconfig:\n  theme: dark\n---\ngraph TD\n  A-->B\n';
    expect(extractMermaidTitle(src)).toEqual({
      title: 'My title',
      cleanSource: '---\nconfig:\n  theme: dark\n---\ngraph TD\n  A-->B\n',
    });
  });

  it('treats an empty title as no title (and leaves source unchanged)', () => {
    const src = '---\ntitle: \n---\ngraph TD\n';
    expect(extractMermaidTitle(src)).toEqual({ title: null, cleanSource: src });
  });

  it('returns null title (but leaves source unchanged) when frontmatter has no title key', () => {
    const src = '---\nconfig:\n  theme: dark\n---\ngraph TD\n';
    expect(extractMermaidTitle(src)).toEqual({ title: null, cleanSource: src });
  });
});
