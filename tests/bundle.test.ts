jest.mock('../src/wasm/omd2typst', () => ({ renderToTypst: jest.fn() }));

import { writeBundle, checkBundleFolder, expandHome, BUNDLE_MARKER, BundleIo } from '../src/bundle';

/** In-memory file system for the bundle writer. */
function memoryIo(existing: Record<string, string> = {}) {
  const files = new Map<string, string | Uint8Array>(Object.entries(existing));
  const dirs = new Set<string>(Object.keys(existing).map(p => p.slice(0, p.lastIndexOf('/'))));
  const io: BundleIo = {
    exists: p => files.has(p) || dirs.has(p),
    mkdirp: p => { dirs.add(p); },
    writeFile: (p, d) => { files.set(p, d); },
    removeDir: p => {
      for (const k of [...files.keys()]) if (k.startsWith(p + '/')) files.delete(k);
      for (const k of [...dirs]) if (k === p || k.startsWith(p + '/')) dirs.delete(k);
    },
  };
  return { io, files, dirs };
}

const bytes = (s: string) => new TextEncoder().encode(s).buffer as ArrayBuffer;

function reader(vault: Record<string, string>) {
  return jest.fn(async (p: string) => (p in vault ? bytes(vault[p]) : null));
}

describe('writeBundle', () => {
  it('copies referenced images into assets/ and rewrites the references', async () => {
    const mem = memoryIo();
    const readBinary = reader({ 'A/_assets/laptop.png': 'PNG1', 'A/doc-mermaid-0.svg': 'SVG1' });
    const md = '# T\n\n![alt|200](</A/_assets/laptop.png>)\n\n![](<doc-mermaid-0.svg>)\n';
    const res = await writeBundle({ markdown: md, noteDir: 'A', noteName: 'doc', bundleRoot: '/out', readBinary, io: mem.io });

    expect(res).toEqual({ dir: '/out/doc', copied: 2, missing: [] });
    expect(mem.files.get('/out/doc/doc.md')).toBe(
      '# T\n\n![alt|200](<assets/laptop.png>)\n\n![](<assets/doc-mermaid-0.svg>)\n',
    );
    expect(mem.files.has('/out/doc/assets/laptop.png')).toBe(true);
    expect(mem.files.has('/out/doc/assets/doc-mermaid-0.svg')).toBe(true);
    expect(mem.files.has(`/out/doc/${BUNDLE_MARKER}`)).toBe(true);
  });

  it('resolves note-relative references and handles plain destinations and titles', async () => {
    const mem = memoryIo();
    const readBinary = reader({ 'N/img/a b.png': 'X' });
    const md = '![x](img/a%20b.png "Title")\n';
    await writeBundle({ markdown: md, noteDir: 'N', noteName: 'n', bundleRoot: '/out', readBinary, io: mem.io });
    expect(mem.files.get('/out/n/n.md')).toBe('![x](<assets/a b.png> "Title")\n');
  });

  it('gives clashing file names a unique name and copies a shared file once', async () => {
    const mem = memoryIo();
    const readBinary = reader({ 'a/pic.png': '1', 'b/pic.png': '2' });
    const md = '![](</a/pic.png>) ![](</b/pic.png>) ![](</a/pic.png>)\n';
    const res = await writeBundle({ markdown: md, noteDir: '', noteName: 'n', bundleRoot: '/out', readBinary, io: mem.io });
    expect(res.copied).toBe(2);
    expect(mem.files.get('/out/n/n.md')).toBe('![](<assets/pic.png>) ![](<assets/pic-2.png>) ![](<assets/pic.png>)\n');
    expect(readBinary).toHaveBeenCalledTimes(2);
  });

  it('leaves external links, missing files and code untouched', async () => {
    const mem = memoryIo();
    const readBinary = reader({ 'ok.png': 'X' });
    const md = '![](https://example.com/a.png) ![](<missing.png>) `![](<ok.png>)`\n\n```\n![](<ok.png>)\n```\n\n![](<ok.png>)\n';
    const res = await writeBundle({ markdown: md, noteDir: '', noteName: 'n', bundleRoot: '/out', readBinary, io: mem.io });
    expect(res.missing).toEqual(['missing.png']);
    expect(res.copied).toBe(1);
    expect(mem.files.get('/out/n/n.md')).toBe(
      '![](https://example.com/a.png) ![](<missing.png>) `![](<ok.png>)`\n\n```\n![](<ok.png>)\n```\n\n![](<assets/ok.png>)\n',
    );
  });

  it('replaces an existing bundle but refuses a folder that is not one', async () => {
    const old = memoryIo({ '/out/n/old.md': 'old', [`/out/n/${BUNDLE_MARKER}`]: '' });
    await writeBundle({ markdown: '# new\n', noteDir: '', noteName: 'n', bundleRoot: '/out', readBinary: reader({}), io: old.io });
    expect(old.files.has('/out/n/old.md')).toBe(false);
    expect(old.files.get('/out/n/n.md')).toBe('# new\n');

    const foreign = memoryIo({ '/out/n/precious.txt': 'keep' });
    await expect(
      writeBundle({ markdown: '# new\n', noteDir: '', noteName: 'n', bundleRoot: '/out', readBinary: reader({}), io: foreign.io }),
    ).rejects.toThrow(/not created by this plugin/);
    expect(foreign.files.get('/out/n/precious.txt')).toBe('keep');
  });
});

describe('checkBundleFolder', () => {
  it('accepts an absolute folder outside the vault', () => {
    expect(checkBundleFolder('/Users/me/Exports', '/Users/me/Vault')).toBe('/Users/me/Exports');
  });

  it('rejects empty, relative and in-vault folders', () => {
    expect(() => checkBundleFolder('', '/v')).toThrow(/Set the bundle folder/);
    expect(() => checkBundleFolder('exports', '/v')).toThrow(/absolute/);
    expect(() => checkBundleFolder('/v', '/v')).toThrow(/outside the vault/);
    expect(() => checkBundleFolder('/v/exports', '/v')).toThrow(/outside the vault/);
    // A sibling whose name merely starts with the vault name is fine.
    expect(checkBundleFolder('/v2/exports', '/v')).toBe('/v2/exports');
  });

  it('expands ~ to the home directory', () => {
    expect(expandHome('~/Exports')).toMatch(/\/Exports$/);
    expect(expandHome('~/Exports').startsWith('~')).toBe(false);
  });
});
