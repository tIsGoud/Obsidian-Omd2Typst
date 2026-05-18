import { resolveOutputPath } from '../src/output';
import type { Omd2TypstSettings } from '../src/settings';

const BASE: Omd2TypstSettings = {
  templates: [], defaultTemplate: 'built-in',
  defaultOutputFormat: 'pdf', outputMode: 'same-folder', outputFolder: 'exports',
  defaultLanguage: 'en', frontmatterTemplateMode: 'inline',
  frontmatterInline: '', frontmatterFilePath: '',
};

describe('resolveOutputPath (same-folder)', () => {
  it('replaces .md extension with .pdf', () => {
    const result = resolveOutputPath('notes/report.md', 'pdf', BASE);
    expect(result).toBe('notes/report.pdf');
  });

  it('replaces .md extension with .typ', () => {
    const result = resolveOutputPath('notes/report.md', 'typ', BASE);
    expect(result).toBe('notes/report.typ');
  });

  it('handles a note at vault root', () => {
    const result = resolveOutputPath('note.md', 'pdf', BASE);
    expect(result).toBe('note.pdf');
  });
});

describe('resolveOutputPath (fixed-folder)', () => {
  const settings = { ...BASE, outputMode: 'fixed-folder' as const, outputFolder: 'exports' };

  it('places output in the configured folder', () => {
    const result = resolveOutputPath('notes/deep/report.md', 'pdf', settings);
    expect(result).toBe('exports/report.pdf');
  });

  it('strips path separators from the folder setting', () => {
    const s = { ...settings, outputFolder: 'exports/' };
    expect(resolveOutputPath('note.md', 'pdf', s)).toBe('exports/note.pdf');
  });
});

describe('resolveOutputPath (ask)', () => {
  it('returns null to signal the caller should open a file picker', () => {
    const settings = { ...BASE, outputMode: 'ask' as const };
    expect(resolveOutputPath('note.md', 'pdf', settings)).toBeNull();
  });
});
