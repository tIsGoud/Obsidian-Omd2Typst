import { exportNote } from '../src/exporter';
import type { TFile } from 'obsidian';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { TFile: TFileCtor } = require('obsidian') as { TFile: new (path: string) => TFile };
import type { Omd2TypstSettings, TemplateEntry } from '../src/settings';

jest.mock('../src/wasm/omd2typst', () => ({
  renderToTypst: jest.fn().mockResolvedValue('#heading[Hello]'),
}));
jest.mock('../src/typst-cli', () => ({
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
