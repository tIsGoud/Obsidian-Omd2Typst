import { Plugin, TFile, TAbstractFile, Notice, normalizePath, Menu, MenuItem, Command } from 'obsidian';
import { Omd2TypstSettings, DEFAULT_SETTINGS, OutputFormat, Omd2TypstSettingTab, TemplateEntry } from './settings';
import { resolveDefaultTemplate, exportCommandName } from './template';
import { mergeFrontmatter, buildFrontmatterBlock, parseFrontmatter } from './frontmatter';
import { exportNote } from './exporter';
import { detectSystemTypst, TypstStatus } from './typst-cli';
import { getBuiltinTemplate } from './wasm/omd2typst';
import { TemplateSuggestModal } from './template-picker';

export default class Omd2TypstPlugin extends Plugin {
  settings: Omd2TypstSettings = DEFAULT_SETTINGS;
  typstStatus: TypstStatus = { source: 'none', version: '' };
  private cmdExportPdf: Command | undefined;
  private cmdExportTyp: Command | undefined;

  async onload() {
    await this.loadSettings();

    // Detect system typst binary.
    this.typstStatus = detectSystemTypst();


    // Register 4 commands
    this.cmdExportPdf = this.addCommand({
      id: 'export-pdf',
      name: exportCommandName('PDF', this.settings),
      callback: () => this.exportActiveNote('pdf'),
    });

    this.cmdExportTyp = this.addCommand({
      id: 'export-typ',
      name: exportCommandName('typst file', this.settings),
      callback: () => this.exportActiveNote('typ'),
    });

    this.addCommand({
      id: 'insert-frontmatter',
      name: 'Insert frontmatter',
      callback: () => this.insertFrontmatter(),
    });

    this.addCommand({
      id: 'export-builtin-template',
      name: 'Export built-in template',
      callback: () => this.exportBuiltinTemplate(),
    });

    this.addCommand({
      id: 'export-pdf-pick-template',
      name: 'Export as PDF with template…',
      checkCallback: (checking: boolean) => {
        if (this.settings.templates.length < 1) return false;
        if (!checking) {
          const file = this.app.workspace.getActiveFile();
          if (!file) { new Notice('No active file.'); return; }
          new TemplateSuggestModal(this.app, this.settings, (entry) => {
            void this.exportFile(file, 'pdf', entry);
          }).open();
        }
        return true;
      },
    });

    this.addCommand({
      id: 'export-typ-pick-template',
      name: 'Export as typst file with template…',
      checkCallback: (checking: boolean) => {
        if (this.settings.templates.length < 1) return false;
        if (!checking) {
          const file = this.app.workspace.getActiveFile();
          if (!file) { new Notice('No active file.'); return; }
          new TemplateSuggestModal(this.app, this.settings, (entry) => {
            void this.exportFile(file, 'typ', entry);
          }).open();
        }
        return true;
      },
    });

    // Register file-menu context menus (right-click in file explorer)
    this.registerEvent(
      this.app.workspace.on('file-menu', (menu: Menu, file: TAbstractFile) => {
        if (!(file instanceof TFile) || file.extension !== 'md') return;
        if (!this.settings.showContextMenu) return;
        menu.addItem((item: MenuItem) => {
          item.setTitle('Export as PDF')
              .setIcon('file-pdf')
              .onClick(() => this.exportFile(file, 'pdf'));
        });
        menu.addItem((item: MenuItem) => {
          item.setTitle('Export as typst file')
              .setIcon('file-type')
              .onClick(() => this.exportFile(file, 'typ'));
        });
        if (this.settings.templates.length >= 1) {
          menu.addItem((item: MenuItem) => {
            item.setTitle('Export as PDF with template…')
                .setIcon('file-pdf')
                .onClick(() => {
                  new TemplateSuggestModal(this.app, this.settings, (entry) => {
                    void this.exportFile(file, 'pdf', entry);
                  }).open();
                });
          });
          menu.addItem((item: MenuItem) => {
            item.setTitle('Export as typst file with template…')
                .setIcon('file-type')
                .onClick(() => {
                  new TemplateSuggestModal(this.app, this.settings, (entry) => {
                    void this.exportFile(file, 'typ', entry);
                  }).open();
                });
          });
        }
      })
    );

    this.addSettingTab(new Omd2TypstSettingTab(this.app, this, () => this.typstStatus));

    // Make .typ files visible in the vault without "Show all file types".
    this.registerExtensions(['typ'], 'markdown');
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData() as Partial<Omd2TypstSettings>);
  }

  async saveSettings() {
    await this.saveData(this.settings);
    // addCommand() prefixes the name with the plugin name; replicate that prefix when updating live.
    const prefix = `${this.manifest.name}: `;
    if (this.cmdExportPdf) this.cmdExportPdf.name = prefix + exportCommandName('PDF', this.settings);
    if (this.cmdExportTyp) this.cmdExportTyp.name = prefix + exportCommandName('typst file', this.settings);
  }

  private async exportActiveNote(format: OutputFormat) {
    const file = this.app.workspace.getActiveFile();
    if (!file) {
      new Notice('No active file.');
      return;
    }
    await this.exportFile(file, format);
  }

  private async exportFile(file: TFile, format: OutputFormat, templateOverride?: TemplateEntry | null) {
    try {
      const template = templateOverride !== undefined ? templateOverride : resolveDefaultTemplate(this.settings);
      await exportNote(file, format, template, this.settings, this.app, this);
      new Notice(`Exported: ${file.basename}.${format === 'pdf' ? 'pdf' : 'typ'}`);
    } catch (err) {
      console.error('[omd2typst] Export failed:', err);
      new Notice(`Export failed: ${(err as Error).message}`);
    }
  }

  private async insertFrontmatter() {
    if (this.settings.frontmatterTemplateMode === 'user-defined') {
      new Notice('Frontmatter insertion is set to user defined — manage frontmatter with your own template tool.');
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
