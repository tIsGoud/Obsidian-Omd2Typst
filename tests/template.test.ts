import {
  parseTemplateLanguages,
  checkLanguageCompatibility,
  resolveDefaultTemplate,
  exportCommandName,
} from '../src/template';
import type { TemplateEntry, Omd2TypstSettings } from '../src/settings';

const SETTINGS_BASE: Omd2TypstSettings = {
  templates: [],
  defaultTemplate: 'built-in',
  defaultOutputFormat: 'pdf',
  outputMode: 'same-folder',
  outputFolder: 'exports',
  defaultLanguage: 'en',
  frontmatterTemplateMode: 'inline',
  frontmatterInline: '',
  frontmatterFilePath: '',
  showContextMenu: true,
  showBuiltinInPicker: false,
  customPath: '',
};

describe('parseTemplateLanguages', () => {
  it('returns empty array when no declaration present', () => {
    expect(parseTemplateLanguages('#set page(paper: "a4")')).toEqual([]);
  });

  it('parses a single language', () => {
    const src = '#let _lang_strings = (\n  "nl": (),\n)';
    expect(parseTemplateLanguages(src)).toEqual(['nl']);
  });

  it('parses multiple languages', () => {
    const src = '#let _lang_strings = (\n  "nl": (),\n  "en": (),\n)';
    expect(parseTemplateLanguages(src)).toEqual(['nl', 'en']);
  });
});

describe('checkLanguageCompatibility', () => {
  const entry: TemplateEntry = { name: 'DUO', path: 'tmpl.typ', languages: ['nl', 'en'] };

  it('returns null when languages match', () => {
    expect(checkLanguageCompatibility(entry, 'nl')).toBeNull();
  });

  it('returns warning message on mismatch', () => {
    const msg = checkLanguageCompatibility(entry, 'fr');
    expect(msg).toContain('DUO');
    expect(msg).toContain('nl, en');
    expect(msg).toContain('fr');
  });

  it('returns null when template has no language declaration', () => {
    const noLang: TemplateEntry = { name: 'Plain', path: 'p.typ', languages: [] };
    expect(checkLanguageCompatibility(noLang, 'fr')).toBeNull();
  });
});

describe('resolveDefaultTemplate', () => {
  it('returns null (built-in) when defaultTemplate is built-in', () => {
    expect(resolveDefaultTemplate(SETTINGS_BASE)).toBeNull();
  });

  it('returns the matching TemplateEntry when found', () => {
    const tmpl: TemplateEntry = { name: 'DUO', path: 'tmpl.typ', languages: [] };
    const settings = { ...SETTINGS_BASE, templates: [tmpl], defaultTemplate: 'DUO' };
    expect(resolveDefaultTemplate(settings)).toBe(tmpl);
  });

  it('returns null when defaultTemplate name is not in list', () => {
    const settings = { ...SETTINGS_BASE, defaultTemplate: 'Missing' };
    expect(resolveDefaultTemplate(settings)).toBeNull();
  });
});

describe('exportCommandName', () => {
  it('uses "Built-in" label when defaultTemplate is built-in', () => {
    expect(exportCommandName('PDF', SETTINGS_BASE)).toBe('Export as PDF (Built-in)');
  });

  it('uses the template name when a custom template is set', () => {
    const s = { ...SETTINGS_BASE, defaultTemplate: 'purple-template' };
    expect(exportCommandName('typst file', s)).toBe('Export as typst file (purple-template)');
  });
});
