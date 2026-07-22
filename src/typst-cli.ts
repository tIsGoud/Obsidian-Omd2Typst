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
  /** The mode under which typst runs. */
  mode: 'native' | 'wsl' | 'none';
}

export interface TypstTool {
  mode: 'native' | 'wsl';
  command: string;
  args: string[];
}

/**
 * Detect whether a system typst binary is available and return a status object.
 * This is a synchronous, best-effort probe — never throws.
 */
export function detectSystemTypst(customPath?: string): TypstStatus {
  const tool = findTypstBinary(customPath);
  if (!tool) return { source: 'none', version: '', mode: 'none' };
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- child_process not available via ESM in Electron
    const cp = require('child_process') as typeof import('child_process');
    const raw = cp.execFileSync(tool.command, tool.args.concat(['--version']), { stdio: 'pipe' }).toString().trim();
    const match = raw.match(/(\d+\.\d+\.\d+)/);
    const version = match ? match[1] : raw;
    const path = tool.mode === 'wsl' ? 'wsl.exe' : (tool.command === 'typst' ? undefined : tool.command);
    return { source: 'system', version, path, mode: tool.mode };
  } catch {
    return { source: 'none', version: '', mode: 'none' };
  }
}

function findWslExecutable(): string | null {
  if (process.platform !== 'win32' || !nodeFs) return null;
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- child_process not available via ESM in Electron
  const cp = require('child_process') as typeof import('child_process');
  const candidates = ['wsl.exe', 'wsl'];
  for (const cmd of candidates) {
    try {
      cp.execFileSync(cmd, ['--status'], { stdio: 'pipe' });
      return cmd;
    } catch {
      // ignore
    }
  }
  return null;
}

export function winPathToWslPath(p: string): string {
  if (!p) return p;
  const normalized = p.replace(/\\/g, '/');
  const match = normalized.match(/^([A-Za-z]):(.*)$/);
  if (match) {
    return `/mnt/${match[1].toLowerCase()}${match[2]}`;
  }
  return normalized;
}

export function findTypstBinary(customPath?: string): TypstTool | null {
  if (!nodeFs) return null;
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- child_process not available via ESM in Electron
  const cp = require('child_process') as typeof import('child_process');

  // Custom path override
  if (customPath) {
    if (customPath.startsWith('wsl:')) {
      const wslCmd = findWslExecutable();
      if (!wslCmd) return null;
      const typstCmd = customPath.slice(4) || 'typst';
      return { mode: 'wsl', command: wslCmd, args: ['-e', typstCmd] };
    }
    return { mode: 'native', command: customPath, args: [] };
  }

  // Auto-detect: WSL first, then native
  const wsl = findWslExecutable();
  if (wsl) {
    try {
      cp.execFileSync(wsl, ['-e', 'typst', '--version'], { stdio: 'pipe' });
      return { mode: 'wsl', command: wsl, args: ['-e', 'typst'] };
    } catch {
      // ignore
    }
  }

  try {
    cp.execFileSync('typst', ['--version'], { stdio: 'pipe' });
    return { mode: 'native', command: 'typst', args: [] };
  } catch {
    // ignore
  }

  const candidates = [
    '/opt/homebrew/bin/typst',   // macOS ARM Homebrew
    '/usr/local/bin/typst',       // macOS Intel Homebrew / manual install
    '/usr/bin/typst',             // Linux distro package
    process.env.HOME ? `${process.env.HOME}/.cargo/bin/typst` : '',
  ];
  for (const p of candidates) {
    if (p && nodeFs.existsSync(p)) {
      return { mode: 'native', command: p, args: [] };
    }
  }
  return null;
}

export function buildTypstCompileArgs(
  tool: TypstTool,
  typPath: string,
  pdfPath: string,
  rootPath: string,
): { command: string; args: string[] } {
  if (tool.mode === 'wsl') {
    return {
      command: tool.command,
      args: tool.args.concat([
        'compile',
        winPathToWslPath(typPath),
        winPathToWslPath(pdfPath),
        '--root',
        winPathToWslPath(rootPath),
      ]),
    };
  }
  return {
    command: tool.command,
    args: ['compile', typPath, pdfPath, '--root', rootPath],
  };
}

/**
 * Check whether typst is installed and return its version string.
 * Throws if not found or not executable.
 */
export function checkTypstInstalled(customPath?: string): string {
  if (!nodeFs) throw new Error('Not running in Electron/Node environment');
  const tool = findTypstBinary(customPath);
  if (!tool) throw new Error('typst not found. Install from https://typst.app or add to PATH.');
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- child_process not available via ESM in Electron
  const cp = require('child_process') as typeof import('child_process');
  return cp.execFileSync(tool.command, tool.args.concat(['--version']), { stdio: 'pipe' }).toString().trim();
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
 * customPath — custom path override for typst executable
 */
export async function compileToPdfViaCli(
  typstSrc: string,
  vaultBase: string,
  noteFolder: string,
  customPath?: string,
): Promise<Uint8Array> {
  if (!nodeFs || !nodePath) throw new Error('CLI requires Electron/Node environment');
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- child_process not available via ESM in Electron
  const cp = require('child_process') as typeof import('child_process');

  const tool = findTypstBinary(customPath);
  if (!tool) throw new Error('typst CLI not found. Install it from https://typst.app or add it to PATH.');

  // Use Node fs directly — bypasses Obsidian's vault watcher so the temp file
  // is never indexed and the ENOENT from async vault reads doesn't occur.
  const typFolder = noteFolder ? nodePath.join(vaultBase, noteFolder) : vaultBase;
  const tmpBase = nodePath.join(typFolder, `__omd2typst_${Date.now()}`);
  const realTypPath = `${tmpBase}.typ`;
  const realPdfPath = `${tmpBase}.pdf`;

  nodeFs.writeFileSync(realTypPath, typstSrc, 'utf8');

  const execArgs = buildTypstCompileArgs(tool, realTypPath, realPdfPath, vaultBase);

  try {
    cp.execFileSync(execArgs.command, execArgs.args, { timeout: 120_000, stdio: 'pipe' });
    const buf = nodeFs.readFileSync(realPdfPath);
    return new Uint8Array(buf);
  } finally {
    try { nodeFs.unlinkSync(realTypPath); } catch { /* best-effort cleanup */ }
    try { nodeFs.unlinkSync(realPdfPath); } catch { /* best-effort cleanup */ }
  }
}

