import { Plugin, TFile, Notice, normalizePath } from 'obsidian';
import { Omd2TypstSettings, DEFAULT_SETTINGS, OutputFormat, Omd2TypstSettingTab } from './settings';
import { resolveDefaultTemplate } from './template';
import { mergeFrontmatter, buildFrontmatterBlock, parseFrontmatter } from './frontmatter';
import { exportNote } from './exporter';
import { detectSystemTypst, TypstStatus } from './typst-cli';
import { getBuiltinTemplate } from './wasm/omd2typst';

export default class Omd2TypstPlugin extends Plugin {
  settings: Omd2TypstSettings = DEFAULT_SETTINGS;
  typstStatus: TypstStatus = { source: 'none', version: '' };

  async onload() {
    await this.loadSettings();

    // Detect system typst binary.
    this.typstStatus = detectSystemTypst();

    if (this.typstStatus.source === 'system') {
      console.log(`[omd2typst] System typst ${this.typstStatus.version} found`);
    } else {
      console.log('[omd2typst] typst not found — PDF export will fall back to .typ');
    }

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

    this.addSettingTab(new Omd2TypstSettingTab(this.app, this, () => this.typstStatus));

    // Make .typ files visible in the vault without "Show all file types".
    this.registerExtensions(['typ'], 'markdown');
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

  private async insertFrontmatter() {
    if (this.settings.frontmatterTemplateMode === 'user-defined') {
      new Notice('Frontmatter insertion is set to User defined — manage frontmatter with your own template tool.');
      return;
    }

    const file = this.app.workspace.getActiveFile();
    if (!file) { new Notice('No active file.'); return; }
    const editor = this.app.workspace.activeEditor?.editor;
    if (!editor) { new Notice('No active editor.'); return; }

    let templateLines: string[];

    if (this.settings.frontmatterTemplateMode === 'file') {
      const tplFile = this.app.vault.getAbstractFileByPath(this.settings.frontmatterFilePath);
      if (!(tplFile instanceof TFile)) {
        new Notice('Frontmatter template file not found. Check the path in settings.');
        return;
      }
      const tplContent = await this.app.vault.read(tplFile);
      const parsed = parseFrontmatter(tplContent);
      templateLines = parsed ? parsed.lines : [];
      if (templateLines.length === 0) {
        new Notice('Template file has no frontmatter keys.');
        return;
      }
    } else {
      templateLines = buildFrontmatterBlock(this.settings.frontmatterInline);
    }

    const content = editor.getValue();
    const merged = mergeFrontmatter(content, templateLines);
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
