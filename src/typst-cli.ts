// Node.js modules — available in Electron (Obsidian's runtime).
// eslint-disable-next-line @typescript-eslint/no-require-imports -- Node.js built-in, not available via ESM in Electron
const nodeFs   = typeof require !== 'undefined' ? require('fs')   as typeof import('fs')   : null;
// eslint-disable-next-line @typescript-eslint/no-require-imports -- Node.js built-in, not available via ESM in Electron
const nodePath = typeof require !== 'undefined' ? require('path') as typeof import('path') : null;

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
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- child_process not available via ESM in Electron
    const cp = require('child_process') as typeof import('child_process');
    const raw = cp.execSync(`"${bin}" --version`, { stdio: 'pipe' }).toString().trim();
    const match = raw.match(/(\d+\.\d+\.\d+)/);
    const version = match ? match[1] : raw;
    const path = bin === 'typst' ? undefined : bin;
    return { source: 'system', version, path };
  } catch {
    return { source: 'none', version: '' };
  }
}

/** Return the absolute path of the typst binary, or null if not found. */
export function findTypstBinary(): string | null {
  if (!nodeFs) return null;
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- child_process not available via ESM in Electron
  const cp = require('child_process') as typeof import('child_process');
  try { cp.execSync('typst --version', { stdio: 'pipe' }); return 'typst'; } catch { /* fall through */ }
  const candidates = [
    '/opt/homebrew/bin/typst',   // macOS ARM Homebrew
    '/usr/local/bin/typst',       // macOS Intel Homebrew / manual install
    '/usr/bin/typst',             // Linux distro package
    process.env.HOME ? `${process.env.HOME}/.cargo/bin/typst` : '',
  ];
  for (const p of candidates) {
    if (p && nodeFs.existsSync(p)) return p;
  }
  return null;
}

/**
 * Check whether typst is installed and return its version string.
 * Throws if not found or not executable.
 */
export function checkTypstInstalled(): string {
  if (!nodeFs) throw new Error('Not running in Electron/Node environment');
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- child_process not available via ESM in Electron
  const cp = require('child_process') as typeof import('child_process');
  const bin = findTypstBinary();
  if (!bin) throw new Error('typst not found. Install from https://typst.app or add to PATH.');
  return cp.execSync(`"${bin}" --version`, { stdio: 'pipe' }).toString().trim();
}

/**
 * Compile Typst source to PDF using the system typst CLI.
 * Writes a temp .typ file directly via Node fs (bypassing Obsidian's vault
 * watcher) at the vault root so vault-relative image paths resolve correctly.
 *
 * typstSrc  — Typst source string
 * vaultBase — absolute vault root on the filesystem
 */
export async function compileToPdfViaCli(typstSrc: string, vaultBase: string): Promise<Uint8Array> {
  if (!nodeFs || !nodePath) throw new Error('CLI requires Electron/Node environment');
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- child_process not available via ESM in Electron
  const cp = require('child_process') as typeof import('child_process');

  const bin = findTypstBinary();
  if (!bin) throw new Error('typst CLI not found. Install it from https://typst.app or add it to PATH.');

  // Use Node fs directly — bypasses Obsidian's vault watcher so the temp file
  // is never indexed and the ENOENT from async vault reads doesn't occur.
  const tmpBase = nodePath.join(vaultBase, `__omd2typst_${Date.now()}`);
  const realTypPath = `${tmpBase}.typ`;
  const realPdfPath = `${tmpBase}.pdf`;

  nodeFs.writeFileSync(realTypPath, typstSrc, 'utf8');

  const cmd = [
    `"${bin}"`,
    'compile',
    `"${realTypPath}"`,
    `"${realPdfPath}"`,
    `--root "${vaultBase}"`,
  ].join(' ');

  console.log('[omd2typst] CLI compile:', cmd);
  try {
    cp.execSync(cmd, { timeout: 120_000, stdio: 'pipe' });
    const buf = nodeFs.readFileSync(realPdfPath);
    return new Uint8Array(buf);
  } finally {
    try { nodeFs.unlinkSync(realTypPath); } catch { /* best-effort cleanup */ }
    try { nodeFs.unlinkSync(realPdfPath); } catch { /* best-effort cleanup */ }
  }
}
