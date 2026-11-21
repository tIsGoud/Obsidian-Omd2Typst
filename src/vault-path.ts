import * as nodePath from 'path';

interface PathApi {
  relative(from: string, to: string): string;
  resolve(...parts: string[]): string;
  isAbsolute(p: string): boolean;
  sep: string;
}
const path = nodePath as unknown as PathApi;

/**
 * The vault-relative, `/`-separated path of an absolute file-system path, or
 * null when it is not inside the vault (or is the vault folder itself).
 */
export function toVaultPath(absolutePath: string, vaultBase: string): string | null {
  if (!vaultBase) return null;
  const rel = path.relative(path.resolve(vaultBase), path.resolve(absolutePath));
  if (rel === '' || rel.startsWith('..') || path.isAbsolute(rel)) return null;
  return rel.split(path.sep).join('/');
}
