import { exportNote } from '../src/exporter';
import type { TFile } from 'obsidian';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { TFile: TFileCtor } = require('obsidian') as { TFile: new (path: string) => TFile };
import type { Omd2TypstSettings, TemplateEntry } from '../src/settings';

jest.mock('../src/wasm/omd2typst', () => ({
  renderToTypst: jest.fn().mockResolvedValue('#heading[Hello]'),
}));
jest.mock('../src/typst-cli', () => ({
  detectSystemTypst: jest.fn().mockReturnValue({ source: 'system', version: '0.15.1' }),
  findTypstBinary: jest.fn().mockReturnValue('/usr/local/bin/typst'),
  compileToPdfViaCli: jest.fn().mockResolvedValue(new Uint8Array([0x25, 0x50, 0x44, 0x46])),
}));

const BASE_SETTINGS: Omd2TypstSettings = {
  templates: [],
  defaultTemplate: 'built-in',
  defaultOutputFormat: 'typ',
  outputMode: 'fixed-folder',
  outputFolder: 'exports',
  defaultLanguage: 'en',
  wikilinkMode: 'text',
  mathSyntax: 'latex',
  excalidrawImage: 'png',
  pdfEmbeds: 'fit',
  filenameCaptions: false,
  imageReferenceWidth: 700,
  bundleFolder: '',
  openBundleFolder: false,
  frontmatterTemplateMode: 'inline',
  frontmatterInline: '',
  frontmatterFilePath: '',
  showContextMenu: true,
  showBuiltinInPicker: false,
};

const noopComponent = { addChild: jest.fn(), removeChild: jest.fn() } as any;

/** Create a minimal TFile-like object for testing. */
function makeTFile(path: string): TFile {
  const parts = path.split('/');
  const name = parts[parts.length - 1];
  const extension = name.includes('.') ? name.split('.').pop()! : '';
  const basename = name.replace(/\.[^.]+$/, '');
  const parent = parts.length > 1 ? { path: parts.slice(0, -1).join('/') } : null;
  return { path, name, extension, basename, parent } as unknown as TFile;
}

function makeApp(overrides: {
  read?: jest.Mock;
  getAbstractFileByPath?: jest.Mock;
} = {}) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { FileSystemAdapter } = require('obsidian') as { FileSystemAdapter: new (p: string) => { getBasePath(): string } };
  const adapterBase = new FileSystemAdapter('/tmp/vault');
  const adapter = Object.assign(adapterBase, {
    write:       jest.fn().mockResolvedValue(undefined),
    writeBinary: jest.fn().mockResolvedValue(undefined),
    remove:      jest.fn().mockResolvedValue(undefined),
  });
  const read = overrides.read ?? jest.fn().mockResolvedValue('# Hello\n');
  const getAbstractFileByPath =
    overrides.getAbstractFileByPath ?? jest.fn().mockReturnValue(null);
  return {
    vault: {
      read,
      getAbstractFileByPath,
      adapter,
      getName: () => 'My Vault',
    },
  };
}

describe('exportNote — Typst export', () => {
  it('writes a .typ file when format is typ', async () => {
    const file = makeTFile('notes/hello.md');
    const app = makeApp();

    await exportNote(file, 'typ', null, BASE_SETTINGS, app as any, noopComponent);

    expect(app.vault.adapter.write).toHaveBeenCalledWith(
      'exports/hello.typ',
      '#heading[Hello]',
    );
  });
});

describe('exportNote — wikilink options', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { renderToTypst } = require('../src/wasm/omd2typst') as { renderToTypst: jest.Mock };

  beforeEach(() => renderToTypst.mockClear());

  it('passes the wikilink mode, and the vault name only in link mode', async () => {
    const file = makeTFile('notes/hello.md');

    await exportNote(file, 'typ', null, { ...BASE_SETTINGS, wikilinkMode: 'link' }, makeApp() as any, noopComponent);
    expect(renderToTypst).toHaveBeenLastCalledWith('# Hello\n', null, {
      wikilinks: 'link',
      obsidianVault: 'My Vault',
      math: 'latex',
      filenameCaptions: false,
      imageReferenceWidth: 700,
      pdfEmbeds: 'fit',
      pdfPages: '',
    });

    await exportNote(file, 'typ', null, { ...BASE_SETTINGS, wikilinkMode: 'bold' }, makeApp() as any, noopComponent);
    expect(renderToTypst).toHaveBeenLastCalledWith('# Hello\n', null, {
      wikilinks: 'bold',
      obsidianVault: undefined,
      math: 'latex',
      filenameCaptions: false,
      imageReferenceWidth: 700,
      pdfEmbeds: 'fit',
      pdfPages: '',
    });
  });
});

describe('exportNote — math syntax', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { renderToTypst } = require('../src/wasm/omd2typst') as { renderToTypst: jest.Mock };

  it('passes the math syntax setting', async () => {
    renderToTypst.mockClear();
    await exportNote(makeTFile('notes/hello.md'), 'typ', null, { ...BASE_SETTINGS, mathSyntax: 'typst' }, makeApp() as any, noopComponent);
    expect(renderToTypst).toHaveBeenLastCalledWith('# Hello\n', null, expect.objectContaining({ math: 'typst' }));
  });
});

describe('exportNote — image width reference', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { renderToTypst } = require('../src/wasm/omd2typst') as { renderToTypst: jest.Mock };

  it('passes the reference width, falling back to 700 for invalid values', async () => {
    const file = makeTFile('notes/hello.md');
    await exportNote(file, 'typ', null, { ...BASE_SETTINGS, imageReferenceWidth: 800.9 }, makeApp() as any, noopComponent);
    expect(renderToTypst).toHaveBeenLastCalledWith('# Hello\n', null, expect.objectContaining({ imageReferenceWidth: 800 }));
    await exportNote(file, 'typ', null, { ...BASE_SETTINGS, imageReferenceWidth: 0 }, makeApp() as any, noopComponent);
    expect(renderToTypst).toHaveBeenLastCalledWith('# Hello\n', null, expect.objectContaining({ imageReferenceWidth: 0 }));
    await exportNote(file, 'typ', null, { ...BASE_SETTINGS, imageReferenceWidth: Number.NaN }, makeApp() as any, noopComponent);
    expect(renderToTypst).toHaveBeenLastCalledWith('# Hello\n', null, expect.objectContaining({ imageReferenceWidth: 700 }));
  });
});

describe('exportNote — PDF embeds', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { renderToTypst } = require('../src/wasm/omd2typst') as { renderToTypst: jest.Mock };
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { detectSystemTypst } = require('../src/typst-cli') as { detectSystemTypst: jest.Mock };
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { loadPdfJs, Notice } = require('obsidian') as { loadPdfJs: jest.Mock; Notice: jest.Mock };

  const md = '# Hello\n\n![](</A/annex.pdf>)\n';
  const appWithPdf = () => {
    const app = makeApp({ read: jest.fn().mockResolvedValue(md) });
    (app.vault.adapter as any).readBinary = jest.fn().mockResolvedValue(new Uint8Array(5).buffer);
    return app;
  };

  beforeEach(() => {
    renderToTypst.mockClear();
    Notice.mockClear();
    loadPdfJs.mockClear();
    detectSystemTypst.mockReturnValue({ source: 'system', version: '0.15.1' });
    loadPdfJs.mockResolvedValue({ getDocument: () => ({ promise: Promise.resolve({ numPages: 5 }) }) });
  });

  it('passes the mode and the page counts of embedded PDFs', async () => {
    await exportNote(makeTFile('notes/hello.md'), 'pdf', null, { ...BASE_SETTINGS, pdfEmbeds: 'full' }, appWithPdf() as any, noopComponent);
    expect(renderToTypst).toHaveBeenLastCalledWith(md, null, expect.objectContaining({ pdfEmbeds: 'full', pdfPages: '5\t/A/annex.pdf' }));
  });

  it('leaves PDF embeds out silently (engine mode skip) and counts no pages when set to Do not include', async () => {
    await exportNote(makeTFile('notes/hello.md'), 'pdf', null, { ...BASE_SETTINGS, pdfEmbeds: 'off' }, appWithPdf() as any, noopComponent);
    expect(renderToTypst).toHaveBeenLastCalledWith(md, null, expect.objectContaining({ pdfEmbeds: 'skip', pdfPages: '' }));
    expect(loadPdfJs).not.toHaveBeenCalled();
  });

  it('leaves PDF embeds out with a notice when the system Typst is older than 0.14', async () => {
    detectSystemTypst.mockReturnValue({ source: 'system', version: '0.13.1' });
    await exportNote(makeTFile('notes/hello.md'), 'pdf', null, BASE_SETTINGS, appWithPdf() as any, noopComponent);
    expect(renderToTypst).toHaveBeenLastCalledWith(md, null, expect.objectContaining({ pdfEmbeds: 'off', pdfPages: '' }));
    expect(Notice).toHaveBeenCalledWith(expect.stringContaining('Typst 0.14'));
  });

  it('keeps the mode for a .typ export, which is compiled later', async () => {
    detectSystemTypst.mockReturnValue({ source: 'system', version: '0.13.1' });
    await exportNote(makeTFile('notes/hello.md'), 'typ', null, BASE_SETTINGS, appWithPdf() as any, noopComponent);
    expect(renderToTypst).toHaveBeenLastCalledWith(md, null, expect.objectContaining({ pdfEmbeds: 'fit' }));
  });
});

describe('exportNote — PDF export', () => {
  it('passes Typst source to CLI and writes PDF with correct magic bytes', async () => {
    const file = makeTFile('notes/hello.md');
    const app = makeApp();

    await exportNote(file, 'pdf', null, BASE_SETTINGS, app as any, noopComponent);

    // compileToPdfViaCli receives (typstSrc, vaultBase, noteFolder). The note
    // lives at notes/hello.md so the folder is "notes".
    const { compileToPdfViaCli } = require('../src/typst-cli');
    expect(compileToPdfViaCli).toHaveBeenCalledWith('#heading[Hello]', expect.any(String), 'notes');

    // PDF is written via writeBinary; write should not be called
    expect((app.vault.adapter.write as jest.Mock).mock.calls.length).toBe(0);
    const binaryCalls = (app.vault.adapter.writeBinary as jest.Mock).mock.calls;
    expect(binaryCalls.length).toBe(1);
    expect(binaryCalls[0][0]).toBe('exports/hello.pdf');
    const bytes = new Uint8Array(binaryCalls[0][1] as ArrayBuffer);
    expect(bytes[0]).toBe(0x25); // %
    expect(bytes[1]).toBe(0x50); // P
    expect(bytes[2]).toBe(0x44); // D
    expect(bytes[3]).toBe(0x46); // F
  });
});

describe('exportNote — language mismatch', () => {
  it('emits a Notice on language mismatch but still exports', async () => {
    const file = makeTFile('notes/hello.md');
    const template: TemplateEntry = {
      name: 'DUO',
      path: 'templates/duo.typ',
      languages: ['nl'],
    };

    // Template file existence is verified via getAbstractFileByPath;
    // the file content is no longer read — the renderer uses the path for #import.
    const templateFile = new TFileCtor('templates/duo.typ');
    const app = makeApp({
      read: jest.fn().mockResolvedValueOnce('---\nlanguage: en\n---\n# Hello\n'),
      getAbstractFileByPath: jest.fn().mockReturnValue(templateFile),
    });

    // Spy on Notice constructor
    const noticeMock = jest.spyOn(require('obsidian'), 'Notice');

    await exportNote(file, 'typ', template, BASE_SETTINGS, app as any, noopComponent);

    // Notice should have been called with a string mentioning 'nl' and 'en'
    expect(noticeMock).toHaveBeenCalled();
    const noticeArg = noticeMock.mock.calls[0][0] as string;
    expect(noticeArg).toContain('nl');
    expect(noticeArg).toContain('en');

    // Export should still have proceeded
    expect(app.vault.adapter.write).toHaveBeenCalled();

    noticeMock.mockRestore();
  });
});
