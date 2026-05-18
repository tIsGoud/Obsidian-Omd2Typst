import type { Omd2TypstSettings, OutputFormat } from './settings';

/**
 * Resolve the vault-relative output path for an export.
 * Returns null when outputMode is 'ask' — the caller opens a file picker.
 */
export function resolveOutputPath(
  notePath: string,
  format: OutputFormat,
  settings: Omd2TypstSettings,
): string | null {
  const ext = `.${format}`;
  const basename = notePath.replace(/\.md$/, '');
  const filename = basename.split('/').pop()! + ext;

  switch (settings.outputMode) {
    case 'same-folder':
      return basename + ext;

    case 'fixed-folder': {
      const folder = settings.outputFolder.replace(/\/+$/, '');
      return `${folder}/${filename}`;
    }

    case 'ask':
      return null;
  }
}
