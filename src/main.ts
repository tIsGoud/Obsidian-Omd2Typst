import { Plugin, TFile, Notice, normalizePath } from 'obsidian';
import { Omd2TypstSettings, DEFAULT_SETTINGS, OutputFormat, Omd2TypstSettingTab } from './settings';
import { resolveDefaultTemplate } from './template';
import { mergeFrontmatter } from './frontmatter';
import { exportNote } from './exporter';
import { setTypstWasmPath } from './wasm/typst';
import { setOmd2TypstWasmPath, getBuiltinTemplate } from './wasm/omd2typst';

export default class Omd2TypstPlugin extends Plugin {
  settings: Omd2TypstSettings = DEFAULT_SETTINGS;

  async onload() {
    await this.loadSettings();

    // Configure the Typst WASM compiler path
    // FileSystemAdapter.getResourcePath is not in the public DataAdapter interface
    const wasmPath = (this.app.vault.adapter as any).getResourcePath(
      normalizePath(`${this.manifest.dir}/wasm-runtime/typst_ts_web_compiler_bg.wasm`)
    );
    setTypstWasmPath(wasmPath, this.app);

    // Configure the omd2typst WASM path
    const omd2typstWasmPath = (this.app.vault.adapter as any).getResourcePath(
      normalizePath(`${this.manifest.dir}/wasm-runtime/omd2typst_bg.wasm`)
    );
    setOmd2TypstWasmPath(omd2typstWasmPath);

    // Register 4 commands
    this.addCommand({
      id: 'export-pdf',
      name: 'Export as PDF',
      callback: () => this.exportActiveNote('pdf'),
    });

    this.addCommand({
      id: 'export-typ',
      name: 'Export as Typst source (.typ)',
      callback: () => this.exportActiveNote('typ'),
    });

    this.addCommand({
      id: 'insert-frontmatter',
      name: 'Insert omd2typst frontmatter',
      callback: () => this.insertFrontmatter(),
    });

    this.addCommand({
      id: 'export-builtin-template',
      name: 'Export built-in template',
      callback: () => this.exportBuiltinTemplate(),
    });

    // Register file-menu context menus (right-click in file explorer)
    this.registerEvent(
      this.app.workspace.on('file-menu', (menu: any, file: any) => {
        if (!(file instanceof TFile) || file.extension !== 'md') return;
        menu.addItem((item: any) => {
          item.setTitle('Export as PDF (omd2typst)')
              .setIcon('file-pdf')
              .onClick(() => this.exportFile(file, 'pdf'));
        });
        menu.addItem((item: any) => {
          item.setTitle('Export as Typst source (omd2typst)')
              .setIcon('file-type')
              .onClick(() => this.exportFile(file, 'typ'));
        });
      })
    );

    this.addSettingTab(new Omd2TypstSettingTab(this.app, this));
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }

  private async exportActiveNote(format: OutputFormat) {
    const file = this.app.workspace.getActiveFile();
    if (!file) {
      new Notice('No active file.');
      return;
    }
    await this.exportFile(file, format);
  }

  private async exportFile(file: TFile, format: OutputFormat) {
    try {
      const template = resolveDefaultTemplate(this.settings);
      await exportNote(file, format, template, this.settings, this.app);
      new Notice(`Exported: ${file.basename}.${format === 'pdf' ? 'pdf' : 'typ'}`);
    } catch (err) {
      console.error('[omd2typst] Export failed:', err);
      new Notice(`Export failed: ${(err as Error).message}`);
    }
  }

  private insertFrontmatter() {
    const file = this.app.workspace.getActiveFile();
    if (!file) {
      new Notice('No active file.');
      return;
    }
    const editor = this.app.workspace.activeEditor?.editor;
    if (!editor) {
      new Notice('No active editor.');
      return;
    }
    const content = editor.getValue();
    const templateKeys = buildFrontmatterBlock(this.settings.frontmatterInline);
    const merged = mergeFrontmatter(content, templateKeys);
    editor.setValue(merged);
  }

  private async exportBuiltinTemplate() {
    const template = await getBuiltinTemplate();
    // Write to vault root as 'omd2typst-template.typ'
    const destPath = normalizePath('omd2typst-template.typ');
    await this.app.vault.adapter.write(destPath, template);
    new Notice(`Built-in template exported to ${destPath}`);
  }
}
