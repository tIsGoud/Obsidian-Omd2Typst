import { exportNote } from '../src/exporter';
import type { TFile } from 'obsidian';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { TFile: TFileCtor } = require('obsidian') as { TFile: new (path: string) => TFile };
import type { Omd2TypstSettings, TemplateEntry } from '../src/settings';

jest.mock('../src/wasm/omd2typst', () => ({
  renderToTypst: jest.fn().mockResolvedValue('#heading[Hello]'),
}));
jest.mock('../src/wasm/typst', () => ({
  compileToPdf: jest.fn().mockResolvedValue(new Uint8Array([0x25, 0x50, 0x44, 0x46])),
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
};

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
  const adapterWrite = jest.fn().mockResolvedValue(undefined);
  const read = overrides.read ?? jest.fn().mockResolvedValue('# Hello\n');
  const getAbstractFileByPath =
    overrides.getAbstractFileByPath ?? jest.fn().mockReturnValue(null);
  return {
    vault: {
      read,
      getAbstractFileByPath,
      adapter: {
        write: adapterWrite,
      },
    },
  };
}

describe('exportNote — Typst export', () => {
  it('writes a .typ file when format is typ', async () => {
    const file = makeTFile('notes/hello.md');
    const app = makeApp();

    await exportNote(file, 'typ', null, BASE_SETTINGS, app as any);

    expect(app.vault.adapter.write).toHaveBeenCalledWith(
      'exports/hello.typ',
      '#heading[Hello]',
    );
  });
});

describe('exportNote — PDF export', () => {
  it('writes .typ first then .pdf with correct magic bytes', async () => {
    const file = makeTFile('notes/hello.md');
    const app = makeApp();

    await exportNote(file, 'pdf', null, BASE_SETTINGS, app as any);

    const calls = (app.vault.adapter.write as jest.Mock).mock.calls;
    expect(calls.length).toBe(2);

    // First write: intermediate .typ file
    expect(calls[0][0]).toBe('exports/hello.typ');
    expect(calls[0][1]).toBe('#heading[Hello]');

    // Second write: .pdf with PDF magic bytes
    expect(calls[1][0]).toBe('exports/hello.pdf');
    const pdfBytes: Uint8Array = calls[1][1];
    expect(pdfBytes[0]).toBe(0x25); // %
    expect(pdfBytes[1]).toBe(0x50); // P
    expect(pdfBytes[2]).toBe(0x44); // D
    expect(pdfBytes[3]).toBe(0x46); // F
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

    await exportNote(file, 'typ', template, BASE_SETTINGS, app as any);

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
