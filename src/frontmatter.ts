const FM_DELIM = '---';

interface ParsedFrontmatter {
  keys: string[];
  /** Byte offset of the opening '---\n' (0). */
  openEnd: number;
  /** Byte offset just after the closing '---'. */
  closeEnd: number;
}

/** Extract the list of keys from a note's YAML frontmatter block. */
export function parseFrontmatter(content: string): ParsedFrontmatter | null {
  const trimmed = content.trimStart();
  if (!trimmed.startsWith(FM_DELIM)) return null;
  const afterOpen = trimmed.slice(3);
  const closeIdx = findFrontmatterClose(afterOpen);
  if (closeIdx === null) return null;

  const yamlBlock = afterOpen.slice(0, closeIdx);
  const keys = yamlBlock
    .split('\n')
    .map(l => l.split(':')[0].trim())
    .filter(k => k.length > 0 && !k.startsWith('#'));

  const openEnd  = 4; // '---\n'
  const closeEnd = 4 + closeIdx + 4; // '---\n' + yaml + '\n---'
  return { keys, openEnd, closeEnd };
}

/**
 * Merge template keys into the note's frontmatter.
 * Missing keys are prepended above existing keys; existing keys are untouched.
 * If the note has no frontmatter, a full block is inserted at the top.
 */
export function mergeFrontmatter(noteContent: string, templateKeys: string[]): string {
  const parsed = parseFrontmatter(noteContent);
  if (!parsed) {
    const block = `${FM_DELIM}\n${templateKeys.map(k => `${k}:`).join('\n')}\n${FM_DELIM}\n`;
    return block + noteContent;
  }

  const existingKeys = new Set(parsed.keys);
  const missingKeys = templateKeys.filter(k => !existingKeys.has(k));
  if (missingKeys.length === 0) return noteContent;

  // Insert missing keys immediately after the opening ---
  const insertLines = missingKeys.map(k => `${k}:`).join('\n') + '\n';
  return (
    `${FM_DELIM}\n` +
    insertLines +
    noteContent.slice(parsed.openEnd, parsed.closeEnd) +
    noteContent.slice(parsed.closeEnd)
  );
}

/** Convert the inline YAML-lines setting string to a list of key names. */
export function buildFrontmatterBlock(yamlLines: string): string[] {
  return yamlLines
    .split('\n')
    .map(l => l.split(':')[0].trim())
    .filter(k => k.length > 0 && !k.startsWith('#'));
}

function findFrontmatterClose(s: string): number | null {
  let from = 0;
  while (true) {
    const idx = s.indexOf('\n---', from);
    if (idx === -1) return null;
    const after = idx + 4;
    if (after >= s.length || s[after] === '\n' || s[after] === '\r') return idx;
    from = idx + 1;
  }
}
