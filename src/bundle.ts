import { App, Component, FileSystemAdapter, TFile } from 'obsidian';
import * as nodeFs from 'fs';
import * as nodeOs from 'os';
import * as nodePath from 'path';
import type { Omd2TypstSettings } from './settings';
import { preprocessNote } from './exporter';
import { mapLinesOutsideFences } from './md-code';

/**
 * Export a note as a "bundle": a folder outside the vault with the note as
 * plain Markdown plus an `assets/` folder holding every image it uses (normal
 * images, Mermaid diagrams and Excalidraw drawings rendered by Obsidian, Bases
 * tables are already Markdown). Image references are relative, so the bundle
 * converts anywhere with `omd2typst note.md note.pdf`, without Obsidian.
 *
 * Node's fs/os/path are narrowed to the minimal interfaces below, as in
 * typst-cli.ts, so the file lints identically with or without `@types/node`.
 */

interface FsApi {
  existsSync(p: string): boolean;
  mkdirSync(p: string, options: { recursive: boolean }): void;
  writeFileSync(p: string, data: string | Uint8Array): void;
  rmSync(p: string, options: { recursive: boolean; force: boolean }): void;
}
interface PathApi {
  join(...parts: string[]): string;
  resolve(...parts: string[]): string;
  relative(from: string, to: string): string;
  isAbsolute(p: string): boolean;
}
interface OsApi { homedir(): string }

const nodeFsApi = nodeFs as unknown as FsApi;
const path = nodePath as unknown as PathApi;
const os = nodeOs as unknown as OsApi;

/** Marker file: only folders carrying it are ever replaced by a re-export. */
export const BUNDLE_MARKER = '.omd2typst-bundle';

/** Operations on the real file system; replaced in tests. */
export interface BundleIo {
  exists(p: string): boolean;
  mkdirp(p: string): void;
  writeFile(p: string, data: string | Uint8Array): void;
  removeDir(p: string): void;
}

export const nodeBundleIo: BundleIo = {
  exists: p => nodeFsApi.existsSync(p),
  mkdirp: p => nodeFsApi.mkdirSync(p, { recursive: true }),
  writeFile: (p, data) => nodeFsApi.writeFileSync(p, data),
  removeDir: p => nodeFsApi.rmSync(p, { recursive: true, force: true }),
};

/** CommonMark inline image: `![alt](dest)` / `![alt](<dest>)` / `![alt](dest "title")`. */
const MD_IMAGE_RE = /!\[([^\]]*)\]\(\s*(<[^>]*>|[^)\s]+)((?:\s+"[^"]*")?)\s*\)/g;

/** Matches a scheme (`https:`, `data:`) — an external reference. */
const EXTERNAL_RE = /^[a-z][a-z0-9+.-]*:/i;

/** `~/folder` → the home directory; everything else unchanged. */
export function expandHome(p: string): string {
  const trimmed = p.trim();
  return trimmed === '~' || trimmed.startsWith('~/') ? path.join(os.homedir(), trimmed.slice(1)) : trimmed;
}

/** Why `folder` cannot be used as a bundle folder, or null when it can. Empty is not a problem. */
export function bundleFolderProblem(folder: string, vaultBase: string): string | null {
  if (folder.trim() === '') return null;
  try {
    checkBundleFolder(folder, vaultBase);
    return null;
  } catch (err) {
    return (err as Error).message;
  }
}

/** Throws unless `folder` is an absolute path outside the vault. */
export function checkBundleFolder(folder: string, vaultBase: string): string {
  const expanded = expandHome(folder);
  if (expanded === '') {
    throw new Error('Set the bundle folder in the plugin settings first.');
  }
  if (!path.isAbsolute(expanded)) {
    throw new Error('The bundle folder must be an absolute path, for example /Users/you/Exports.');
  }
  const root = path.resolve(expanded);
  if (vaultBase) {
    const rel = path.relative(path.resolve(vaultBase), root);
    if (rel === '' || (!rel.startsWith('..') && !path.isAbsolute(rel))) {
      throw new Error('The bundle folder must be outside the vault, so it cannot interfere with your notes.');
    }
  }
  return root;
}

/** Normalise a `/`-separated vault path, collapsing `.` and `..`. */
function normalizeVaultPath(p: string): string {
  const out: string[] = [];
  for (const seg of p.split('/')) {
    if (seg === '' || seg === '.') continue;
    if (seg === '..') { out.pop(); continue; }
    out.push(seg);
  }
  return out.join('/');
}

function splitName(name: string): { stem: string; ext: string } {
  const dot = name.lastIndexOf('.');
  return dot <= 0 ? { stem: name, ext: '' } : { stem: name.slice(0, dot), ext: name.slice(dot) };
}

export interface BundleResult {
  /** The bundle folder that was written. */
  dir: string;
  /** Images copied into `assets/`. */
  copied: number;
  /** Image references whose file could not be read; left as they were. */
  missing: string[];
}

export interface BundleInput {
  markdown: string;
  /** Vault folder of the note (`''` for the vault root); relative image paths start here. */
  noteDir: string;
  noteName: string;
  /** Absolute bundle root, outside the vault. */
  bundleRoot: string;
  /** Reads a vault file, or resolves to null when it cannot be read. */
  readBinary(vaultPath: string): Promise<ArrayBuffer | null>;
  io?: BundleIo;
}

/**
 * Write the bundle: copy every referenced image into `assets/` (once, with a
 * unique name) and rewrite the references to `assets/<name>`. Images inside
 * code are left alone.
 */
export async function writeBundle(input: BundleInput): Promise<BundleResult> {
  const io = input.io ?? nodeBundleIo;
  const dir = path.join(input.bundleRoot, input.noteName);
  const assetsDir = path.join(dir, 'assets');

  // 1) Find the images: reference -> vault path.
  const refs = new Set<string>();
  const vaultPathOf = (dest: string): string | null => {
    let p = dest;
    try { p = decodeURIComponent(p); } catch { /* keep the raw text */ }
    if (p === '' || p.startsWith('//') || EXTERNAL_RE.test(p)) return null;
    return p.startsWith('/') ? normalizeVaultPath(p) : normalizeVaultPath(`${input.noteDir}/${p}`);
  };
  const destOf = (raw: string): string => (raw.startsWith('<') && raw.endsWith('>') ? raw.slice(1, -1) : raw);

  mapLinesOutsideFences(input.markdown, line => {
    // `String.matchAll` is not in the ES2018 lib the store lint uses: exec loop.
    const re = new RegExp(MD_IMAGE_RE.source, 'g');
    let m: RegExpExecArray | null;
    while ((m = re.exec(line)) !== null) {
      const vaultPath = vaultPathOf(destOf(m[2]));
      if (vaultPath) refs.add(vaultPath);
    }
    return line;
  });

  // 2) Read them and pick unique asset names.
  const assets = new Map<string, { name: string; data: Uint8Array }>();
  const namesTaken = new Set<string>();
  const missing: string[] = [];
  for (const vaultPath of refs) {
    let data: ArrayBuffer | null = null;
    try { data = await input.readBinary(vaultPath); } catch { data = null; }
    if (!data) { missing.push(vaultPath); continue; }
    const { stem, ext } = splitName(vaultPath.slice(vaultPath.lastIndexOf('/') + 1));
    let name = `${stem}${ext}`;
    for (let n = 2; namesTaken.has(name.toLowerCase()); n++) name = `${stem}-${n}${ext}`;
    namesTaken.add(name.toLowerCase());
    assets.set(vaultPath, { name, data: new Uint8Array(data) });
  }

  // 3) Rewrite the references.
  const markdown = mapLinesOutsideFences(input.markdown, line =>
    line.replace(new RegExp(MD_IMAGE_RE.source, 'g'), (whole, alt: string, dest: string, title: string) => {
      const vaultPath = vaultPathOf(destOf(dest));
      const asset = vaultPath ? assets.get(vaultPath) : undefined;
      return asset ? `![${alt}](<assets/${asset.name}>${title})` : whole;
    }),
  );

  // 4) Write the folder. An existing folder is only replaced if it is a bundle.
  if (io.exists(dir)) {
    if (!io.exists(path.join(dir, BUNDLE_MARKER))) {
      throw new Error(`'${dir}' already exists and was not created by this plugin. Move it or choose another bundle folder.`);
    }
    io.removeDir(dir);
  }
  io.mkdirp(assetsDir);
  io.writeFile(path.join(dir, BUNDLE_MARKER), 'Created by the Omd2Typst plugin. This folder is replaced when the note is exported again.\n');
  for (const { name, data } of assets.values()) io.writeFile(path.join(assetsDir, name), data);
  io.writeFile(path.join(dir, `${input.noteName}.md`), markdown);

  return { dir, copied: assets.size, missing };
}

/** Export the note as a bundle in `folder` (default: the configured bundle folder). */
export async function exportBundle(
  file: TFile,
  settings: Omd2TypstSettings,
  app: App,
  parent: Component,
  folder: string = settings.bundleFolder,
): Promise<BundleResult> {
  const adapter = app.vault.adapter;
  const vaultBase = adapter instanceof FileSystemAdapter ? adapter.getBasePath() : '';
  const bundleRoot = checkBundleFolder(folder, vaultBase);

  const { markdown, cleanup } = await preprocessNote(file, settings, app, parent);
  try {
    const noteDir = (file.parent?.path ?? '').replace(/^\/+|\/+$/g, '');
    return await writeBundle({
      markdown,
      noteDir,
      noteName: file.basename,
      bundleRoot,
      readBinary: async p => (await adapter.exists(p)) ? await adapter.readBinary(p) : null,
    });
  } finally {
    await cleanup();
  }
}
