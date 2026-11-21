import { expandHome } from './bundle';
import type { PickResult } from './folder-dialog';

/** Which folder a bundle export should use, and whether to remember it. */
export interface FolderChoice {
  folder: string;
  /** True when the folder was picked because none was configured: save it as the bundle folder. */
  remember: boolean;
}

/**
 * Decide the bundle folder for one export.
 *
 * - `chooseEachTime`: always ask; the choice is used once and not saved.
 * - otherwise the configured folder is used; if none is set yet the user is
 *   asked once and the choice is remembered (after a successful export).
 *
 * Returns null when the user cancels the dialog. Throws when a dialog is needed
 * but the platform cannot show one.
 */
export function chooseBundleFolder(options: {
  configured: string;
  chooseEachTime: boolean;
  pick: (title: string, defaultPath?: string) => PickResult;
}): FolderChoice | null {
  const configured = options.configured.trim();
  if (!options.chooseEachTime && configured !== '') {
    return { folder: configured, remember: false };
  }

  const title = options.chooseEachTime
    ? 'Choose a folder for the bundle (a folder named after the note is created inside it)'
    : 'Choose the folder where bundles are saved';
  const result = options.pick(title, configured !== '' ? expandHome(configured) : undefined);
  if (result.status === 'unavailable') {
    throw new Error('The folder picker is not available in this version of Obsidian. Type the path in the plugin settings (Bundle folder).');
  }
  if (result.status === 'cancelled') return null;
  return { folder: result.path, remember: !options.chooseEachTime };
}
