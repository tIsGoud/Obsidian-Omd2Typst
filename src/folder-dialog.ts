/**
 * Native folder dialog and "open folder" through Electron.
 *
 * Obsidian exposes Electron as `window.electron`, with `remote` (the
 * `@electron/remote` module) and `shell`; Obsidian itself uses
 * `electron.remote.dialog.showOpenDialogSync` for its own file pickers. This is
 * not part of the documented plugin API, so everything here is optional: when
 * a piece is missing the callers fall back to typing the path in the settings.
 * Local structural types keep the file independent of Electron's typings.
 */

interface ElectronLike {
  remote?: {
    dialog?: {
      showOpenDialogSync(options: {
        title?: string;
        buttonLabel?: string;
        defaultPath?: string;
        filters?: { name: string; extensions: string[] }[];
        properties: string[];
      }): string[] | undefined;
    };
  };
  shell?: { openPath(path: string): Promise<string> };
}

function electron(): ElectronLike | null {
  if (typeof window === 'undefined') return null;
  return (window as unknown as { electron?: ElectronLike }).electron ?? null;
}

export type PickResult =
  | { status: 'picked'; path: string }
  | { status: 'cancelled' }
  | { status: 'unavailable' };

function showOpenDialog(options: {
  title: string;
  defaultPath?: string;
  filters?: { name: string; extensions: string[] }[];
  properties: string[];
}): PickResult {
  const dialog = electron()?.remote?.dialog;
  if (!dialog) return { status: 'unavailable' };
  try {
    const picked = dialog.showOpenDialogSync({
      title: options.title,
      buttonLabel: 'Choose',
      ...(options.defaultPath ? { defaultPath: options.defaultPath } : {}),
      ...(options.filters ? { filters: options.filters } : {}),
      properties: [...options.properties, 'dontAddToRecent'],
    });
    return picked && picked.length > 0 ? { status: 'picked', path: picked[0] } : { status: 'cancelled' };
  } catch {
    return { status: 'unavailable' };
  }
}

/** Show the native "choose a folder" dialog (with a New Folder button on macOS). */
export function pickFolder(title: string, defaultPath?: string): PickResult {
  return showOpenDialog({ title, defaultPath, properties: ['openDirectory', 'createDirectory'] });
}

/** Show the native "choose a file" dialog, optionally limited to some extensions (without the dot). */
export function pickFile(
  title: string,
  options: { defaultPath?: string; extensions?: string[]; filterName?: string } = {},
): PickResult {
  return showOpenDialog({
    title,
    defaultPath: options.defaultPath,
    filters: options.extensions ? [{ name: options.filterName ?? 'Files', extensions: options.extensions }] : undefined,
    properties: ['openFile'],
  });
}

/** Open a folder in the system file manager. Resolves to false when that is not possible. */
export async function openFolder(path: string): Promise<boolean> {
  const shell = electron()?.shell;
  if (!shell) return false;
  try {
    // openPath resolves to an error message, or '' on success.
    return (await shell.openPath(path)) === '';
  } catch {
    return false;
  }
}
