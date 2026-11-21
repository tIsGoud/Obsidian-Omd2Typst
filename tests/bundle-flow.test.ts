jest.mock('../src/wasm/omd2typst', () => ({ renderToTypst: jest.fn() }));
import { chooseBundleFolder } from '../src/bundle-flow';
import { bundleFolderProblem } from '../src/bundle';
import { pickFolder, openFolder } from '../src/folder-dialog';

const picked = (path: string) => jest.fn().mockReturnValue({ status: 'picked', path });

describe('chooseBundleFolder', () => {
  it('uses the configured folder without asking', () => {
    const pick = jest.fn();
    expect(chooseBundleFolder({ configured: '/out', chooseEachTime: false, pick })).toEqual({ folder: '/out', remember: false });
    expect(pick).not.toHaveBeenCalled();
  });

  it('asks the first time when no folder is configured, and remembers the choice', () => {
    const pick = picked('/chosen');
    expect(chooseBundleFolder({ configured: '  ', chooseEachTime: false, pick })).toEqual({ folder: '/chosen', remember: true });
    expect(pick).toHaveBeenCalledTimes(1);
  });

  it('always asks when choosing each time, starts in the configured folder, and does not remember', () => {
    const pick = picked('/once');
    expect(chooseBundleFolder({ configured: '/out', chooseEachTime: true, pick })).toEqual({ folder: '/once', remember: false });
    expect(pick).toHaveBeenCalledWith(expect.stringContaining('named after the note'), '/out');
  });

  it('returns null when the dialog is cancelled and throws when there is no dialog', () => {
    expect(chooseBundleFolder({ configured: '', chooseEachTime: false, pick: jest.fn().mockReturnValue({ status: 'cancelled' }) })).toBeNull();
    expect(() => chooseBundleFolder({ configured: '', chooseEachTime: false, pick: jest.fn().mockReturnValue({ status: 'unavailable' }) }))
      .toThrow(/folder picker is not available/);
  });
});

describe('bundleFolderProblem', () => {
  it('is null for empty and valid folders and explains invalid ones', () => {
    expect(bundleFolderProblem('', '/v')).toBeNull();
    expect(bundleFolderProblem('/out', '/v')).toBeNull();
    expect(bundleFolderProblem('/v/out', '/v')).toMatch(/outside the vault/);
    expect(bundleFolderProblem('out', '/v')).toMatch(/absolute/);
  });
});

describe('folder dialog', () => {
  afterEach(() => { delete (global as any).window; });

  it('picks a folder, reports cancel and unavailable', () => {
    const show = jest.fn().mockReturnValueOnce(['/a']).mockReturnValueOnce(undefined);
    (global as any).window = { electron: { remote: { dialog: { showOpenDialogSync: show } } } };
    expect(pickFolder('t', '/start')).toEqual({ status: 'picked', path: '/a' });
    expect(show).toHaveBeenCalledWith(expect.objectContaining({ defaultPath: '/start', properties: expect.arrayContaining(['openDirectory', 'createDirectory']) }));
    expect(pickFolder('t')).toEqual({ status: 'cancelled' });
    (global as any).window = {};
    expect(pickFolder('t')).toEqual({ status: 'unavailable' });
  });

  it('opens a folder through the shell, false when it fails', async () => {
    const openPath = jest.fn().mockResolvedValueOnce('').mockResolvedValueOnce('boom');
    (global as any).window = { electron: { shell: { openPath } } };
    expect(await openFolder('/x')).toBe(true);
    expect(await openFolder('/x')).toBe(false);
    (global as any).window = {};
    expect(await openFolder('/x')).toBe(false);
  });
});
