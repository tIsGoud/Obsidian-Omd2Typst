import type { TemplateEntry, Omd2TypstSettings } from './settings';

/** Detect supported languages by reading the top-level keys of `_lang_strings` in a .typ file. */
export function parseTemplateLanguages(typContent: string): string[] {
  const blockMatch = typContent.match(/#let _lang_strings\s*=\s*\(([\s\S]*?)\n\)/);
  if (!blockMatch) return [];
  const langs: string[] = [];
  const re = /^\s+"([a-z]{2})"\s*:/gm;
  let m: RegExpExecArray | null;
  while ((m = re.exec(blockMatch[1])) !== null) {
    langs.push(m[1]);
  }
  return langs;
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

/** Returns the command palette label for an export command, including the default template name. */
export function exportCommandName(verb: string, settings: Omd2TypstSettings): string {
  const label = settings.defaultTemplate === 'built-in'
    ? 'Built-in'
    : settings.defaultTemplate;
  return `Export as ${verb} (${label})`;
}
