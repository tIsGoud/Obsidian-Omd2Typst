/**
 * Options of an Obsidian image embed: the text after the first `|` in
 * `![[image.png|200|alt text]]`.
 *
 * Obsidian accepts them in any order. A segment that is a size (`200` or
 * `100x145`) gives the width (the height is ignored, the aspect ratio is kept);
 * every other segment is alt text. Mirrors the engine's `split_embed_options`.
 */
export function parseEmbedOptions(options: string): { alt: string; width: string } {
  const alt: string[] = [];
  let width = '';
  for (const raw of options.split('|')) {
    const seg = raw.trim();
    if (seg === '') continue;
    const size = /^(\d+)(?:x\d+)?$/.exec(seg);
    if (size) {
      if (width === '') width = size[1];
    } else {
      alt.push(seg);
    }
  }
  return { alt: alt.join('|'), width };
}

/** Markdown image `![alt|width](<dest>)` as the engine expects it. */
export function markdownImage(alt: string, width: string, dest: string): string {
  return `![${alt}${width ? `|${width}` : ''}](<${dest}>)`;
}
