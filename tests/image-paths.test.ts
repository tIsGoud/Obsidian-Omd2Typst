import type { App, TFile } from 'obsidian';
import { TFile as TFileClass } from 'obsidian';
import { resolveImagePaths } from '../src/image-paths';

function makeFile(path: string): TFile {
  return new (TFileClass as unknown as new (p: string) => TFile)(path);
}

/**
 * Build an App whose vault contains the given file paths.
 *
 * - `getAbstractFileByPath` returns a TFile for an exact vault path, else null.
 * - `getFirstLinkpathDest` mimics Obsidian: exact vault-root path first, then a
 *   basename ("shortest path") match. `sourcePath` is accepted but unused here —
 *   the note-relative case is exercised through `getAbstractFileByPath`.
 */
function makeApp(paths: string[]): App {
  const byPath = new Map(paths.map(p => [p, makeFile(p)]));
  return {
    vault: {
      getAbstractFileByPath: jest.fn((p: string) => byPath.get(p) ?? null),
    },
    metadataCache: {
      getFirstLinkpathDest: jest.fn((linkpath: string) => {
        if (byPath.has(linkpath)) return byPath.get(linkpath)!;
        const base = linkpath.split('/').pop()!;
        for (const [p, f] of byPath) {
          if (p.split('/').pop() === base) return f;
        }
        return null;
      }),
    },
  } as unknown as App;
}

const NOTE = 'A/proj/input/doc.md';
const ASSET = 'A/proj/input/_assets/laptop.png';

describe('resolveImagePaths — markdown images', () => {
  it('rewrites a folder-relative image to a /-absolute resolved path', () => {
    const app = makeApp([ASSET]);
    const out = resolveImagePaths('![alt tekst](_assets/laptop.png)', app, makeFile(NOTE));
    expect(out).toBe(`![alt tekst](</${ASSET}>)`);
  });

  it('rewrites a vault-root path WITHOUT a leading slash (the reported bug)', () => {
    const app = makeApp([ASSET]);
    const src = `![alt tekst](${ASSET})`;
    const out = resolveImagePaths(src, app, makeFile(NOTE));
    expect(out).toBe(`![alt tekst](</${ASSET}>)`);
  });

  it('preserves the |width alt segment', () => {
    const app = makeApp([ASSET]);
    const out = resolveImagePaths('![alt tekst|200](_assets/laptop.png)', app, makeFile(NOTE));
    expect(out).toBe(`![alt tekst|200](</${ASSET}>)`);
  });

  it('resolves a ./-prefixed relative path', () => {
    const app = makeApp([ASSET]);
    const out = resolveImagePaths('![x](./_assets/laptop.png)', app, makeFile(NOTE));
    expect(out).toBe(`![x](</${ASSET}>)`);
  });

  it('resolves a ../ relative path against the note folder', () => {
    const shared = 'A/proj/shared/pic.png';
    const app = makeApp([shared]);
    const out = resolveImagePaths('![x](../shared/pic.png)', app, makeFile(NOTE));
    expect(out).toBe(`![x](</${shared}>)`);
  });

  it('resolves a bare filename via shortest-path (file lives in a subfolder)', () => {
    const app = makeApp([ASSET]);
    const out = resolveImagePaths('![x](laptop.png)', app, makeFile(NOTE));
    expect(out).toBe(`![x](</${ASSET}>)`);
  });

  it('unwraps an existing angle-bracket destination and re-emits resolved', () => {
    const app = makeApp([ASSET]);
    const out = resolveImagePaths('![x](<_assets/laptop.png>)', app, makeFile(NOTE));
    expect(out).toBe(`![x](</${ASSET}>)`);
  });

  it('decodes percent-encoded spaces before resolving', () => {
    const spaced = 'A/proj/input/_assets/my laptop.png';
    const app = makeApp([spaced]);
    const out = resolveImagePaths('![x](_assets/my%20laptop.png)', app, makeFile(NOTE));
    expect(out).toBe(`![x](</${spaced}>)`);
  });

  it('leaves an already /-absolute path unchanged', () => {
    const app = makeApp([ASSET]);
    const src = `![x](/${ASSET})`;
    expect(resolveImagePaths(src, app, makeFile(NOTE))).toBe(src);
  });

  it('leaves an external URL unchanged', () => {
    const app = makeApp([ASSET]);
    const src = '![x](https://example.com/laptop.png)';
    expect(resolveImagePaths(src, app, makeFile(NOTE))).toBe(src);
  });

  it('leaves an unresolvable path unchanged', () => {
    const app = makeApp([ASSET]);
    const src = '![x](_assets/does-not-exist.png)';
    expect(resolveImagePaths(src, app, makeFile(NOTE))).toBe(src);
  });
});

describe('resolveImagePaths — wikilink embeds', () => {
  it('converts an image embed to a /-absolute markdown image', () => {
    const app = makeApp([ASSET]);
    const out = resolveImagePaths('![[_assets/laptop.png]]', app, makeFile(NOTE));
    expect(out).toBe(`![](</${ASSET}>)`);
  });

  it('preserves the |width as an alt segment (matches engine conversion)', () => {
    const app = makeApp([ASSET]);
    const out = resolveImagePaths('![[_assets/laptop.png|150]]', app, makeFile(NOTE));
    expect(out).toBe(`![|150](</${ASSET}>)`);
  });

  it('rewrites a full vault-path wikilink embed', () => {
    const app = makeApp([ASSET]);
    const out = resolveImagePaths(`![[${ASSET}|150]]`, app, makeFile(NOTE));
    expect(out).toBe(`![|150](</${ASSET}>)`);
  });

  it('leaves a non-image embed (note transclusion) untouched', () => {
    const app = makeApp(['A/proj/Other.md']);
    const src = '![[Other]]';
    expect(resolveImagePaths(src, app, makeFile(NOTE))).toBe(src);
  });
});

describe('resolveImagePaths — code is not rewritten', () => {
  it('does not touch an image inside a fenced code block', () => {
    const app = makeApp([ASSET]);
    const src = '```markdown\n![alt tekst](_assets/laptop.png)\n```';
    expect(resolveImagePaths(src, app, makeFile(NOTE))).toBe(src);
  });

  it('does not touch an image inside an indented ~~~ fence', () => {
    const app = makeApp([ASSET]);
    const src = '~~~\n![x](_assets/laptop.png)\n~~~';
    expect(resolveImagePaths(src, app, makeFile(NOTE))).toBe(src);
  });

  it('does not touch an image inside an inline code span', () => {
    const app = makeApp([ASSET]);
    const src = 'Use `![x](_assets/laptop.png)` for images.';
    expect(resolveImagePaths(src, app, makeFile(NOTE))).toBe(src);
  });

  it('rewrites the real image but leaves the fenced example intact', () => {
    const app = makeApp([ASSET]);
    const src =
      '```markdown\n![alt tekst](_assets/laptop.png)\n```\n\n![alt tekst](_assets/laptop.png)';
    const out = resolveImagePaths(src, app, makeFile(NOTE));
    expect(out).toBe(
      `\`\`\`markdown\n![alt tekst](_assets/laptop.png)\n\`\`\`\n\n![alt tekst](</${ASSET}>)`,
    );
  });
});

describe('resolveImagePaths — no-op', () => {
  it('returns identical markdown when there are no images', () => {
    const app = makeApp([ASSET]);
    const src = '# Heading\n\nJust text, no images.\n';
    expect(resolveImagePaths(src, app, makeFile(NOTE))).toBe(src);
  });
});
