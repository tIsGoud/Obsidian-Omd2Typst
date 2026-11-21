/** Helpers for editing Markdown without touching code. */

/** Apply `fn` to the parts of a line outside inline-code spans. */
export function outsideInlineCode(line: string, fn: (s: string) => string): string {
  return line
    .split(/(`+[^`]*`+)/g)
    .map(seg => (seg.startsWith('`') ? seg : fn(seg)))
    .join('');
}

/** Run `fn` on every line outside fenced code blocks (lines are replaced in place). */
export function mapLinesOutsideFences(markdown: string, fn: (line: string) => string): string {
  const lines = markdown.split('\n');
  let fenceChar = '';
  let fenceLen = 0;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (fenceChar) {
      const close = line.match(/^\s*(`{3,}|~{3,})\s*$/);
      if (close && close[1][0] === fenceChar && close[1].length >= fenceLen) {
        fenceChar = '';
        fenceLen = 0;
      }
      continue;
    }
    const open = line.match(/^(\s*)(`{3,}|~{3,})/);
    if (open) {
      fenceChar = open[2][0];
      fenceLen = open[2].length;
      continue;
    }
    lines[i] = outsideInlineCode(line, fn);
  }
  return lines.join('\n');
}
