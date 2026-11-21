import { renderExcalidrawEmbeds, isExcalidrawLink } from '../src/excalidraw';
import type { TFile } from 'obsidian';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { TFile: TFileCtor } = require('obsidian') as { TFile: new (path: string) => TFile };

const NOTE = new TFileCtor('notes/doc.md');

function makeApp(files: string[]) {
  const known = new Map(files.map(p => [p, new TFileCtor(p)]));
  return {
    metadataCache: {
      getFirstLinkpathDest: jest.fn((link: string) => known.get(link) ?? null),
    },
    vault: {
      getAbstractFileByPath: jest.fn((p: string) => known.get(p) ?? null),
      adapter: {
        write: jest.fn().mockResolvedValue(undefined),
        writeBinary: jest.fn().mockResolvedValue(undefined),
        remove: jest.fn().mockResolvedValue(undefined),
      },
    },
  };
}

function makeEa() {
  const png = { arrayBuffer: jest.fn().mockResolvedValue(new ArrayBuffer(4)) };
  return {
    reset: jest.fn(),
    getExportSettings: jest.fn().mockReturnValue({ withBackground: true, withTheme: true }),
    getEmbeddedFilesLoader: jest.fn().mockReturnValue({}),
    createPNG: jest.fn().mockResolvedValue(png),
    createSVG: jest.fn().mockResolvedValue({}),
    destroy: jest.fn(),
  };
}

function withExcalidraw(ea: ReturnType<typeof makeEa> | null) {
  (global as any).window = ea ? { ExcalidrawAutomate: { getAPI: () => ea } } : {};
}

describe('isExcalidrawLink', () => {
  it('recognises drawing links', () => {
    expect(isExcalidrawLink('Drawing.excalidraw')).toBe(true);
    expect(isExcalidrawLink('Drawing.excalidraw.md')).toBe(true);
    expect(isExcalidrawLink('Note')).toBe(false);
    expect(isExcalidrawLink('photo.png')).toBe(false);
  });
});

describe('renderExcalidrawEmbeds', () => {
  afterEach(() => { delete (global as any).window; jest.clearAllMocks(); });

  it('leaves the markdown alone when there are no drawings or the mode is off', async () => {
    withExcalidraw(makeEa());
    const app = makeApp([]);
    const md = '# T\n\n![[photo.png]]\n';
    expect((await renderExcalidrawEmbeds(md, app as any, NOTE, 'png')).markdown).toBe(md);
    const withDrawing = '![[Fig.excalidraw]]\n';
    expect((await renderExcalidrawEmbeds(withDrawing, makeApp(['Fig.excalidraw.md']) as any, NOTE, 'off')).markdown).toBe(withDrawing);
  });

  it('renders a drawing to a light-theme PNG and rewrites the embed with its width', async () => {
    const ea = makeEa();
    withExcalidraw(ea);
    const app = makeApp(['Fig.excalidraw.md']);
    const { markdown, cleanup } = await renderExcalidrawEmbeds('Before\n\n![[Fig.excalidraw|500]]\n', app as any, NOTE, 'png');

    expect(markdown).toBe('Before\n\n![|500](<doc-excalidraw-0.png>)\n');
    expect(ea.getExportSettings).toHaveBeenCalledWith(true, true);
    expect(ea.createPNG).toHaveBeenCalledWith('Fig.excalidraw.md', 2, expect.anything(), expect.anything(), 'light');
    expect(app.vault.adapter.writeBinary).toHaveBeenCalledWith('notes/doc-excalidraw-0.png', expect.any(ArrayBuffer));

    await cleanup();
    expect(app.vault.adapter.remove).toHaveBeenCalledWith('notes/doc-excalidraw-0.png');
  });

  it('writes an SVG when the mode is svg', async () => {
    const ea = makeEa();
    (global as any).XMLSerializer = class { serializeToString() { return '<svg/>'; } };
    withExcalidraw(ea);
    const app = makeApp(['Fig.excalidraw.md']);
    const { markdown } = await renderExcalidrawEmbeds('![[Fig.excalidraw]]\n', app as any, NOTE, 'svg');
    expect(markdown).toBe('![](<doc-excalidraw-0.svg>)\n');
    expect(ea.createSVG).toHaveBeenCalledWith('Fig.excalidraw.md', false, expect.anything(), expect.anything(), 'light');
    expect(app.vault.adapter.write).toHaveBeenCalledWith('notes/doc-excalidraw-0.svg', '<svg/>');
    delete (global as any).XMLSerializer;
  });

  it('uses the alt text of the embed as caption, in any order', async () => {
    withExcalidraw(makeEa());
    const app = makeApp(['Fig.excalidraw.md']);
    const a = await renderExcalidrawEmbeds('![[Fig.excalidraw|500|The design]]\n', app as any, NOTE, 'png');
    expect(a.markdown).toBe('![The design|500](<doc-excalidraw-0.png>)\n');
    const b = await renderExcalidrawEmbeds('![[Fig.excalidraw|The design|500]]\n', makeApp(['Fig.excalidraw.md']) as any, NOTE, 'png');
    expect(b.markdown).toBe('![The design|500](<doc-excalidraw-0.png>)\n');
  });

  it('captions a drawing with its name only when asked, and alt text wins', async () => {
    withExcalidraw(makeEa());
    const md = '![[Fig.excalidraw|500]]\n\n![[Fig.excalidraw|alt]]\n';
    const on = await renderExcalidrawEmbeds(md, makeApp(['Fig.excalidraw.md']) as any, NOTE, 'png', true);
    expect(on.markdown).toBe('![Fig|500](<doc-excalidraw-0.png>)\n\n![alt](<doc-excalidraw-0.png>)\n');
    const off = await renderExcalidrawEmbeds(md, makeApp(['Fig.excalidraw.md']) as any, NOTE, 'png', false);
    expect(off.markdown).toBe('![|500](<doc-excalidraw-0.png>)\n\n![alt](<doc-excalidraw-0.png>)\n');
  });

  it('renders a drawing embedded twice only once', async () => {
    const ea = makeEa();
    withExcalidraw(ea);
    const app = makeApp(['Fig.excalidraw.md']);
    const { markdown } = await renderExcalidrawEmbeds('![[Fig.excalidraw]]\n\n![[Fig.excalidraw|300]]\n', app as any, NOTE, 'png');
    expect(ea.createPNG).toHaveBeenCalledTimes(1);
    expect(markdown).toBe('![](<doc-excalidraw-0.png>)\n\n![|300](<doc-excalidraw-0.png>)\n');
  });

  it('skips code, fragments and unresolved drawings', async () => {
    const ea = makeEa();
    withExcalidraw(ea);
    const app = makeApp(['Fig.excalidraw.md']);
    const md = '`![[Fig.excalidraw]]`\n\n```\n![[Fig.excalidraw]]\n```\n\n![[Fig.excalidraw#^frame=a]]\n\n![[Missing.excalidraw]]\n';
    const { markdown } = await renderExcalidrawEmbeds(md, app as any, NOTE, 'png');
    expect(markdown).toBe(md);
    expect(ea.createPNG).not.toHaveBeenCalled();
  });

  it('falls back to an auto-exported image without the Excalidraw plugin', async () => {
    withExcalidraw(null);
    const app = makeApp(['Fig.excalidraw.md', 'Fig.excalidraw.png']);
    const { markdown } = await renderExcalidrawEmbeds('![[Fig.excalidraw|500]]\n', app as any, NOTE, 'png');
    expect(markdown).toBe('![|500](</Fig.excalidraw.png>)\n');
  });

  it('leaves the embed and warns when nothing can render it', async () => {
    withExcalidraw(null);
    const app = makeApp(['Fig.excalidraw.md']);
    const md = '![[Fig.excalidraw]]\n';
    const { markdown } = await renderExcalidrawEmbeds(md, app as any, NOTE, 'png');
    expect(markdown).toBe(md);
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    expect(require('obsidian').Notice).toHaveBeenCalled();
  });

  it('falls back to the auto-export when rendering fails', async () => {
    const ea = makeEa();
    ea.createPNG.mockRejectedValue(new Error('boom'));
    withExcalidraw(ea);
    const app = makeApp(['Fig.excalidraw.md', 'Fig.excalidraw.png']);
    const { markdown } = await renderExcalidrawEmbeds('![[Fig.excalidraw]]\n', app as any, NOTE, 'png');
    expect(markdown).toBe('![](</Fig.excalidraw.png>)\n');
  });
});
