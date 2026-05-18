export class Plugin {
  app: any = {};
  manifest: any = { dir: '.obsidian/plugins/omd2typst', id: 'omd2typst' };
  addCommand = jest.fn();
  addSettingTab = jest.fn();
  registerEvent = jest.fn();
  loadData = jest.fn().mockResolvedValue({});
  saveData = jest.fn().mockResolvedValue(undefined);
}

export class PluginSettingTab {
  containerEl: any = {
    empty: jest.fn(),
    createEl: jest.fn().mockReturnValue({ createEl: jest.fn() }),
  };
  constructor(public app: any, public plugin: any) {}
  display() {}
}

export class TFile {
  path: string;
  extension: string;
  basename: string;
  name: string;
  parent: { path: string } | null;
  constructor(path: string) {
    this.path = path;
    const parts = path.split('/');
    this.name = parts[parts.length - 1];
    this.extension = this.name.includes('.') ? this.name.split('.').pop()! : '';
    this.basename = this.name.replace(/\.[^.]+$/, '');
    this.parent = parts.length > 1 ? { path: parts.slice(0, -1).join('/') } : null;
  }
}

export class Notice {
  constructor(public message: string, public timeout?: number) {}
}

export class Setting {
  constructor(containerEl: any) {}
  setName = jest.fn().mockReturnThis();
  setDesc = jest.fn().mockReturnThis();
  addText = jest.fn().mockReturnThis();
  addDropdown = jest.fn().mockReturnThis();
  addToggle = jest.fn().mockReturnThis();
  addButton = jest.fn().mockReturnThis();
  addTextArea = jest.fn().mockReturnThis();
}
