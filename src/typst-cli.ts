// Node.js built-ins — available in Electron (Obsidian's runtime, desktop only).
// They are narrowed to the minimal interfaces below so this file type-checks
// (and lints) identically whether or not `@types/node` resolves.
import * as nodeChildProcess from 'child_process';
import * as nodeFs from 'fs';
import * as nodeOs from 'os';
import * as nodePath from 'path';

interface ChildProcessApi {
  execFileSync(
    file: string,
    args: string[],
    options: { stdio?: string; timeout?: number },
  ): { toString(): string };
}
interface FsApi {
  existsSync(p: string): boolean;
  writeFileSync(p: string, data: string, encoding: string): void;
  readFileSync(p: string): Uint8Array;
  unlinkSync(p: string): void;
}
interface OsApi { homedir(): string }
interface PathApi { join(...parts: string[]): string }

const cp = nodeChildProcess as unknown as ChildProcessApi;
const fs = nodeFs as unknown as FsApi;
const os = nodeOs as unknown as OsApi;
const path = nodePath as unknown as PathApi;

export interface TypstStatus {
  /** Whether a system typst binary was found. */
  source: 'system' | 'none';
  /** Human-readable Typst compiler version, e.g. "0.13.1". */
  version: string;
  /** Absolute path to the typst binary — only set when source === 'system'. */
  path?: string;
}

/**
 * Detect whether a system typst binary is available and return a status object.
 * This is a synchronous, best-effort probe — never throws.
 */
export function detectSystemTypst(): TypstStatus {
  const bin = findTypstBinary();
  if (!bin) return { source: 'none', version: '' };
  try {
    const raw = cp.execFileSync(bin, ['--version'], { stdio: 'pipe' }).toString().trim();
    const match = raw.match(/(\d+\.\d+\.\d+)/);
    const version = match ? match[1] : raw;
    return { source: 'system', version, path: bin === 'typst' ? undefined : bin };
  } catch {
    return { source: 'none', version: '' };
  }
}

/** Return the absolute path of the typst binary, or null if not found. */
export function findTypstBinary(): string | null {
  try { cp.execFileSync('typst', ['--version'], { stdio: 'pipe' }); return 'typst'; } catch { /* fall through */ }
  const candidates = [
    '/opt/homebrew/bin/typst',   // macOS ARM Homebrew
    '/usr/local/bin/typst',       // macOS Intel Homebrew / manual install
    '/usr/bin/typst',             // Linux distro package
    path.join(os.homedir(), '.cargo', 'bin', 'typst'),  // cargo install
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  return null;
}

/**
 * Check whether typst is installed and return its version string.
 * Throws if not found or not executable.
 */
export function checkTypstInstalled(): string {
  const bin = findTypstBinary();
  if (!bin) throw new Error('typst not found. Install from https://typst.app or add to PATH.');
  return cp.execFileSync(bin, ['--version'], { stdio: 'pipe' }).toString().trim();
}

/**
 * Compile Typst source to PDF using the system typst CLI.
 *
 * The temp .typ is written next to the note (via Node fs, bypassing Obsidian's
 * vault watcher). This makes folder-relative image references in the source —
 * `./_assets/foo.svg`, bare filenames — resolve the way Obsidian previews them,
 * because Typst resolves relative paths from the .typ file's directory.
 * Vault-root-absolute paths (leading `/`) still work via `--root <vaultBase>`.
 *
 * typstSrc   — Typst source string
 * vaultBase  — absolute vault root on the filesystem
 * noteFolder — vault-root-relative folder of the note; "" for vault-root notes
 */
export async function compileToPdfViaCli(
  typstSrc: string,
  vaultBase: string,
  noteFolder: string,
): Promise<Uint8Array> {
  const bin = findTypstBinary();
  if (!bin) throw new Error('typst CLI not found. Install it from https://typst.app or add it to PATH.');

  // Use Node fs directly — bypasses Obsidian's vault watcher so the temp file
  // is never indexed and the ENOENT from async vault reads doesn't occur.
  const typFolder = noteFolder ? path.join(vaultBase, noteFolder) : vaultBase;
  const tmpBase = path.join(typFolder, `__omd2typst_${Date.now()}`);
  const realTypPath = `${tmpBase}.typ`;
  const realPdfPath = `${tmpBase}.pdf`;

  fs.writeFileSync(realTypPath, typstSrc, 'utf8');

  try {
    cp.execFileSync(
      bin,
      ['compile', realTypPath, realPdfPath, '--root', vaultBase],
      { timeout: 120_000, stdio: 'pipe' },
    );
    const buf = fs.readFileSync(realPdfPath);
    return new Uint8Array(buf);
  } finally {
    try { fs.unlinkSync(realTypPath); } catch { /* best-effort cleanup */ }
    try { fs.unlinkSync(realPdfPath); } catch { /* best-effort cleanup */ }
  }
}
