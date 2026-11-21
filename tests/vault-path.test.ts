import { toVaultPath } from '../src/vault-path';
import { pickFile } from '../src/folder-dialog';

describe('toVaultPath', () => {
  it('returns the vault-relative path of a file inside the vault', () => {
    expect(toVaultPath('/Users/me/Vault/10-System/Frontmatter.md', '/Users/me/Vault')).toBe('10-System/Frontmatter.md');
    expect(toVaultPath('/Users/me/Vault/note.md', '/Users/me/Vault/')).toBe('note.md');
  });

  it('returns null outside the vault, for the vault itself and without a vault', () => {
    expect(toVaultPath('/Users/me/Other/note.md', '/Users/me/Vault')).toBeNull();
    expect(toVaultPath('/Users/me/Vault2/note.md', '/Users/me/Vault')).toBeNull();
    expect(toVaultPath('/Users/me/Vault', '/Users/me/Vault')).toBeNull();
    expect(toVaultPath('/x/note.md', '')).toBeNull();
  });
});

describe('pickFile', () => {
  afterEach(() => { delete (global as any).window; });

  it('opens a file dialog limited to the extensions and starting in the given folder', () => {
    const show = jest.fn().mockReturnValue(['/v/a.md']);
    (global as any).window = { electron: { remote: { dialog: { showOpenDialogSync: show } } } };
    expect(pickFile('Pick', { defaultPath: '/v', extensions: ['md'], filterName: 'Markdown' })).toEqual({ status: 'picked', path: '/v/a.md' });
    expect(show).toHaveBeenCalledWith(expect.objectContaining({
      defaultPath: '/v',
      filters: [{ name: 'Markdown', extensions: ['md'] }],
      properties: expect.arrayContaining(['openFile']),
    }));
    expect(show.mock.calls[0][0].properties).not.toContain('openDirectory');
  });

  it('reports cancel and unavailable', () => {
    (global as any).window = { electron: { remote: { dialog: { showOpenDialogSync: jest.fn().mockReturnValue(undefined) } } } };
    expect(pickFile('Pick')).toEqual({ status: 'cancelled' });
    (global as any).window = {};
    expect(pickFile('Pick')).toEqual({ status: 'unavailable' });
  });
});
