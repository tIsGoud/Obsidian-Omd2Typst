/** True when a Typst version string ("0.15.1") is 0.14 or newer, the first with PDF images. */
export function typstSupportsPdfImages(version: string): boolean {
  const m = /(\d+)\.(\d+)/.exec(version);
  if (!m) return false;
  const major = Number(m[1]);
  const minor = Number(m[2]);
  return major > 0 || minor >= 14;
}
