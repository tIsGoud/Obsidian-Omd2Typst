import { App, AbstractInputSuggest, TFile, TFolder, PluginSettingTab, Setting, TextComponent } from 'obsidian';
import { parseTemplateLanguages } from './template';

// ---------------------------------------------------------------------------
// Suggest helpers
// ---------------------------------------------------------------------------

class TypFileSuggest extends AbstractInputSuggest<TFile> {
  private onPick: (file: TFile) => void;

  constructor(app: App, inputEl: HTMLInputElement, onPick: (file: TFile) => void) {
    super(app, inputEl);
    this.onPick = onPick;
  }

  getSuggestions(query: string): TFile[] {
    const q = query.toLowerCase();
    return this.app.vault
      .getFiles()
      .filter(f => f.extension === 'typ' && f.path.toLowerCase().includes(q))
      .sort((a, b) => a.path.localeCompare(b.path));
  }

  renderSuggestion(file: TFile, el: HTMLElement): void {
    el.createEl('div', { text: file.basename });
    el.createEl('small', { text: file.path });
  }

  selectSuggestion(file: TFile): void {
    this.setValue(file.path);
    this.onPick(file);
    this.close();
  }
}

class MdFileSuggest extends AbstractInputSuggest<TFile> {
  private onPick: (file: TFile) => void;

  constructor(app: App, inputEl: HTMLInputElement, onPick: (file: TFile) => void) {
    super(app, inputEl);
    this.onPick = onPick;
  }

  getSuggestions(query: string): TFile[] {
    const q = query.toLowerCase();
    return this.app.vault
      .getFiles()
      .filter(f => f.extension === 'md' && f.path.toLowerCase().includes(q))
      .sort((a, b) => a.path.localeCompare(b.path));
  }

  renderSuggestion(file: TFile, el: HTMLElement): void {
    el.createEl('div', { text: file.basename });
    el.createEl('small', { text: file.path });
  }

  selectSuggestion(file: TFile): void {
    this.setValue(file.path);
    this.onPick(file);
    this.close();
  }
}

class FolderSuggest extends AbstractInputSuggest<TFolder> {
  private onPick: (folder: TFolder) => void;

  constructor(app: App, inputEl: HTMLInputElement, onPick: (folder: TFolder) => void) {
    super(app, inputEl);
    this.onPick = onPick;
  }

  getSuggestions(query: string): TFolder[] {
    const q = query.toLowerCase();
    return this.app.vault
      .getAllFolders()
      .filter(f => f.path.toLowerCase().includes(q))
      .sort((a, b) => a.path.localeCompare(b.path));
  }

  renderSuggestion(folder: TFolder, el: HTMLElement): void {
    el.createEl('div', { text: folder.path || '/ (vault root)' });
  }

  selectSuggestion(folder: TFolder): void {
    this.setValue(folder.path);
    this.onPick(folder);
    this.close();
  }
}

// ---------------------------------------------------------------------------
// Types and defaults
// ---------------------------------------------------------------------------

export type OutputFormat = 'typ' | 'pdf';
export type OutputMode  = 'same-folder' | 'fixed-folder' | 'ask';
export type FrontmatterTemplateMode = 'inline' | 'file';

export interface TemplateEntry {
  name: string;
  /** Vault-relative path to the .typ file. Empty string for the built-in template. */
  path: string;
  /** Populated by parseTemplateLanguages(); empty if no declaration found. */
  languages: string[];
}

export interface Omd2TypstSettings {
  templates: TemplateEntry[];
  /** Name of the active default template, or 'built-in'. */
  defaultTemplate: string;
  defaultOutputFormat: OutputFormat;
  outputMode: OutputMode;
  /** Vault-relative folder used when outputMode === 'fixed-folder'. */
  outputFolder: string;
  /** Applied when the note frontmatter has no 'language:' key. */
  defaultLanguage: string;
  frontmatterTemplateMode: FrontmatterTemplateMode;
  /** YAML lines (no --- delimiters) used in inline mode. */
  frontmatterInline: string;
  /** Vault-relative path to a .md file used in file mode. */
  frontmatterFilePath: string;
}

export const DEFAULT_SETTINGS: Omd2TypstSettings = {
  templates: [],
  defaultTemplate: 'built-in',
  defaultOutputFormat: 'pdf',
  outputMode: 'same-folder',
  outputFolder: 'exports',
  defaultLanguage: 'en',
  frontmatterTemplateMode: 'inline',
  frontmatterInline: [
    'title:',
    'subtitle:',
    'author:',
    'date:',
    'version:',
    'status:',
    'language:',
    'summary:',
    'figure-list:',
    'revision-table:',
    'approval-table:',
  ].join('\n'),
  frontmatterFilePath: '',
};

// ---------------------------------------------------------------------------
// Settings tab
// ---------------------------------------------------------------------------

export class Omd2TypstSettingTab extends PluginSettingTab {
  plugin: any;
  constructor(app: App, plugin: any) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    // ── Typst Templates ──────────────────────────────────────────────────────
    containerEl.createEl('h3', { text: 'Typst templates' });

    // List existing templates
    for (const tpl of this.plugin.settings.templates as TemplateEntry[]) {
      const langBadge = tpl.languages.length > 0
        ? `${tpl.path}  ·  ${tpl.languages.join(', ')}`
        : tpl.path;
      new Setting(containerEl)
        .setName(tpl.name)
        .setDesc(langBadge)
        .addButton(btn =>
          btn.setButtonText('Remove')
            .setWarning()
            .onClick(async () => {
              this.plugin.settings.templates = (
                this.plugin.settings.templates as TemplateEntry[]
              ).filter(t => t.name !== tpl.name);
              if (this.plugin.settings.defaultTemplate === tpl.name) {
                this.plugin.settings.defaultTemplate = 'built-in';
              }
              await this.plugin.saveSettings();
              this.display();
            })
        );
    }

    // Add template — file picker with autocomplete + optional name override
    let newName = '';
    let newPath = '';
    let nameComp: TextComponent;

    new Setting(containerEl)
      .setName('Add template')
      .setDesc('Select a .typ file from the vault. Name is derived from the filename.')
      .addText(text => {
        nameComp = text;
        text.setPlaceholder('Name (optional)')
          .onChange(v => { newName = v.trim(); });
      })
      .addText(text => {
        text.setPlaceholder('Search .typ files…');
        text.onChange(v => { newPath = v.trim(); });
        new TypFileSuggest(this.app, text.inputEl, (file: TFile) => {
          newPath = file.path;
          if (!newName) {
            newName = file.basename;
            nameComp.setValue(file.basename);
          }
        });
      })
      .addButton(btn =>
        btn.setButtonText('Add')
          .setCta()
          .onClick(async () => {
            if (!newPath) return;
            const name = newName || newPath.split('/').pop()?.replace(/\.typ$/, '') || newPath;
            const already = (this.plugin.settings.templates as TemplateEntry[])
              .some(t => t.name === name);
            if (already) return;
            let languages: string[] = [];
            const file = this.app.vault.getAbstractFileByPath(newPath);
            if (file instanceof TFile) {
              try {
                const content = await this.app.vault.read(file);
                languages = parseTemplateLanguages(content);
              } catch { /* leave empty if unreadable */ }
            }
            (this.plugin.settings.templates as TemplateEntry[]).push({
              name,
              path: newPath,
              languages,
            });
            await this.plugin.saveSettings();
            this.display();
          })
      );

    // Default template selector
    new Setting(containerEl)
      .setName('Default template')
      .setDesc('Template used when exporting without a specific template selected.')
      .addDropdown(dd => {
        dd.addOption('built-in', 'Built-in template');
        for (const tpl of this.plugin.settings.templates as TemplateEntry[]) {
          dd.addOption(tpl.name, tpl.name);
        }
        dd.setValue(this.plugin.settings.defaultTemplate)
          .onChange(async v => {
            this.plugin.settings.defaultTemplate = v;
            await this.plugin.saveSettings();
          });
      });

    // ── Export ───────────────────────────────────────────────────────────────
    containerEl.createEl('h3', { text: 'Export' });

    new Setting(containerEl)
      .setName('Default output format')
      .setDesc('Format used by the palette commands.')
      .addDropdown(dd =>
        dd.addOption('pdf', 'PDF')
          .addOption('typ', 'Typst source (.typ)')
          .setValue(this.plugin.settings.defaultOutputFormat)
          .onChange(async v => {
            this.plugin.settings.defaultOutputFormat = v as OutputFormat;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName('Output location')
      .setDesc('Where to save exported files.')
      .addDropdown(dd =>
        dd.addOption('same-folder', 'Same folder as note')
          .addOption('fixed-folder', 'Fixed folder')
          .addOption('ask', 'Ask every time')
          .setValue(this.plugin.settings.outputMode)
          .onChange(async v => {
            this.plugin.settings.outputMode = v as OutputMode;
            await this.plugin.saveSettings();
            this.display();
          })
      );

    if (this.plugin.settings.outputMode === 'fixed-folder') {
      new Setting(containerEl)
        .setName('Output folder')
        .setDesc('Vault folder where exported files are saved.')
        .addText(text => {
          text.setPlaceholder('Search folders…')
            .setValue(this.plugin.settings.outputFolder)
            .onChange(async v => {
              this.plugin.settings.outputFolder = v;
              await this.plugin.saveSettings();
            });
          new FolderSuggest(this.app, text.inputEl, async (folder: TFolder) => {
            this.plugin.settings.outputFolder = folder.path;
            await this.plugin.saveSettings();
          });
        });
    }

    // ── Document defaults ────────────────────────────────────────────────────
    containerEl.createEl('h3', { text: 'Document defaults' });

    new Setting(containerEl)
      .setName('Default language')
      .setDesc('Used when the note has no language: frontmatter key.')
      .addDropdown(dd =>
        dd.addOption('en', 'English (en)')
          .addOption('nl', 'Nederlands (nl)')
          .addOption('de', 'Deutsch (de)')
          .addOption('es', 'Español (es)')
          .addOption('fr', 'Français (fr)')
          .setValue(this.plugin.settings.defaultLanguage)
          .onChange(async v => {
            this.plugin.settings.defaultLanguage = v;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName('Frontmatter template source')
      .setDesc('How the frontmatter template is defined.')
      .addDropdown(dd =>
        dd.addOption('inline', 'Inline editor')
          .addOption('file', 'Template file')
          .setValue(this.plugin.settings.frontmatterTemplateMode)
          .onChange(async v => {
            this.plugin.settings.frontmatterTemplateMode = v as FrontmatterTemplateMode;
            await this.plugin.saveSettings();
            this.display();
          })
      );

    if (this.plugin.settings.frontmatterTemplateMode === 'inline') {
      new Setting(containerEl)
        .setName('Default frontmatter')
        .setDesc('YAML keys to insert. Remove keys you never use.')
        .addTextArea(ta =>
          ta.setValue(this.plugin.settings.frontmatterInline)
            .onChange(async v => {
              this.plugin.settings.frontmatterInline = v;
              await this.plugin.saveSettings();
            })
        );
    }

    if (this.plugin.settings.frontmatterTemplateMode === 'file') {
      new Setting(containerEl)
        .setName('Frontmatter template file')
        .setDesc('Markdown file whose frontmatter is used as the template.')
        .addText(text => {
          text.setPlaceholder('Search .md files…')
            .setValue(this.plugin.settings.frontmatterFilePath)
            .onChange(async v => {
              this.plugin.settings.frontmatterFilePath = v;
              await this.plugin.saveSettings();
            });
          new MdFileSuggest(this.app, text.inputEl, async (file: TFile) => {
            this.plugin.settings.frontmatterFilePath = file.path;
            await this.plugin.saveSettings();
          });
        });
    }
  }
}
