import type { TemplateEntry, Omd2TypstSettings } from './settings';

/** Parse the `// omd2typst-languages: nl, en` comment from a .typ file's content. */
export function parseTemplateLanguages(typContent: string): string[] {
  const match = typContent.match(/\/\/\s*omd2typst-languages:\s*(.+)/);
  if (!match) return [];
  return match[1].split(',').map(l => l.trim()).filter(Boolean);
}

/**
 * Check whether a template's declared languages include the note's language.
 * Returns a human-readable warning string on mismatch, or null if compatible.
 */
export function checkLanguageCompatibility(
  template: TemplateEntry,
  noteLanguage: string,
): string | null {
  if (template.languages.length === 0) return null;
  if (template.languages.includes(noteLanguage)) return null;
  return (
    `Template '${template.name}' supports ${template.languages.join(', ')} — ` +
    `note language is '${noteLanguage}'.`
  );
}

/** Returns the TemplateEntry to use, or null to signal the built-in template. */
export function resolveDefaultTemplate(settings: Omd2TypstSettings): TemplateEntry | null {
  if (settings.defaultTemplate === 'built-in') return null;
  return settings.templates.find(t => t.name === settings.defaultTemplate) ?? null;
}
