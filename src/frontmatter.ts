const FM_DELIM = '---';

interface ParsedFrontmatter {
  /** Key names only — used for existence checks. */
  keys: string[];
  /** Full trimmed YAML lines (key: value) — used when inserting from a template file. */
  lines: string[];
  /** Byte offset of the opening '---\n' (0). */
  openEnd: number;
  /** Byte offset just after the closing '---'. */
  closeEnd: number;
}

/** Extract key names and full lines from a note's YAML frontmatter block. */
export function parseFrontmatter(content: string): ParsedFrontmatter | null {
  if (!content.startsWith(FM_DELIM)) return null;
  const afterOpen = content.slice(3);
  const closeIdx = findFrontmatterClose(afterOpen);
  if (closeIdx === null) return null;

  const yamlBlock = afterOpen.slice(0, closeIdx);
  const lines = yamlBlock
    .split('\n')
    .map(l => l.trim())
    .filter(l => l.length > 0 && !l.startsWith('#'));
  const keys = lines.map(l => l.split(':')[0].trim());

  const openEnd  = 4; // '---\n'
  const closeEnd = 4 + closeIdx + 4; // '---\n' + yaml + '\n---'
  return { keys, lines, openEnd, closeEnd };
}

/**
 * Merge template lines into the note's frontmatter.
 * Missing keys are prepended above existing keys with their template values.
 * Existing keys are never overwritten.
 * If the note has no frontmatter, a full block is inserted at the top.
 */
export function mergeFrontmatter(noteContent: string, templateLines: string[]): string {
  const parsed = parseFrontmatter(noteContent);
  if (!parsed) {
    const block = `${FM_DELIM}\n${templateLines.join('\n')}\n${FM_DELIM}\n`;
    return block + noteContent;
  }

  const existingKeys = new Set(parsed.keys);
  const missingLines = templateLines.filter(l => !existingKeys.has(l.split(':')[0].trim()));
  if (missingLines.length === 0) return noteContent;

  const insertLines = missingLines.join('\n') + '\n';
  return (
    `${FM_DELIM}\n` +
    insertLines +
    noteContent.slice(parsed.openEnd, parsed.closeEnd) +
    noteContent.slice(parsed.closeEnd)
  );
}

/** Return full trimmed YAML lines from the inline setting string (preserving values). */
export function buildFrontmatterBlock(yamlLines: string): string[] {
  return yamlLines
    .split('\n')
    .map(l => l.trim())
    .filter(l => l.length > 0 && !l.startsWith('#'));
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
