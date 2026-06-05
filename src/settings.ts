import { App, AbstractInputSuggest, Plugin, TFile, TFolder, PluginSettingTab, Setting, TextComponent } from 'obsidian';
import { parseTemplateLanguages } from './template';
import type { TypstStatus } from './typst-cli';

// ---------------------------------------------------------------------------
// Suggest helpers
// ---------------------------------------------------------------------------

class TypFileSuggest extends AbstractInputSuggest<TFile> {
  private onPick: (file: TFile) => void;
  private el: HTMLInputElement;

  constructor(app: App, inputEl: HTMLInputElement, onPick: (file: TFile) => void) {
    super(app, inputEl);
    this.el = inputEl;
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
    this.el.value = file.path;
    this.close();
    this.onPick(file);
  }
}

class MdFileSuggest extends AbstractInputSuggest<TFile> {
  private onPick: (file: TFile) => void | Promise<void>;
  private el: HTMLInputElement;

  constructor(app: App, inputEl: HTMLInputElement, onPick: (file: TFile) => void | Promise<void>) {
    super(app, inputEl);
    this.el = inputEl;
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
    this.el.value = file.path;
    this.close();
    void this.onPick(file);
  }
}

class FolderSuggest extends AbstractInputSuggest<TFolder> {
  private onPick: (folder: TFolder) => void | Promise<void>;
  private el: HTMLInputElement;

  constructor(app: App, inputEl: HTMLInputElement, onPick: (folder: TFolder) => void | Promise<void>) {
    super(app, inputEl);
    this.el = inputEl;
    this.onPick = onPick;
  }

  getSuggestions(query: string): TFolder[] {
    const q = query.toLowerCase();
    const folders: TFolder[] = [];
    const collect = (folder: TFolder) => {
      folders.push(folder);
      for (const child of folder.children) {
        if (child instanceof TFolder) collect(child);
      }
    };
    collect(this.app.vault.getRoot());
    return folders
      .filter(f => f.path.toLowerCase().includes(q))
      .sort((a, b) => a.path.localeCompare(b.path));
  }

  renderSuggestion(folder: TFolder, el: HTMLElement): void {
    el.createEl('div', { text: folder.path || '/ (vault root)' });
  }

  selectSuggestion(folder: TFolder): void {
    this.el.value = folder.path;
    this.close();
    void this.onPick(folder);
  }
}

// ---------------------------------------------------------------------------
// Types and defaults
// ---------------------------------------------------------------------------

export type OutputFormat = 'typ' | 'pdf';
export type OutputMode  = 'same-folder' | 'fixed-folder' | 'ask';
export type FrontmatterTemplateMode = 'inline' | 'file' | 'user-defined';

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

interface PluginHost extends Plugin {
  settings: Omd2TypstSettings;
  saveSettings(): Promise<void>;
}

export class Omd2TypstSettingTab extends PluginSettingTab {
  private plugin: PluginHost;
  private getTypstStatus: () => TypstStatus;

  constructor(app: App, plugin: PluginHost, getTypstStatus: () => TypstStatus) {
    super(app, plugin);
    this.plugin = plugin;
    this.getTypstStatus = getTypstStatus;
  }

  private async refreshTemplateLanguages(): Promise<void> {
    let changed = false;
    for (const tpl of this.plugin.settings.templates) {
      const file = this.app.vault.getAbstractFileByPath(tpl.path);
      if (!(file instanceof TFile)) continue;
      try {
        const content = await this.app.vault.read(file);
        const langs = parseTemplateLanguages(content);
        if (JSON.stringify(langs) !== JSON.stringify(tpl.languages)) {
          tpl.languages = langs;
          changed = true;
        }
      } catch { /* skip unreadable files */ }
    }
    if (changed) {
      await this.plugin.saveSettings();
      this.display();
    }
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    void this.refreshTemplateLanguages();

    // ── Typst Templates ──────────────────────────────────────────────────────
    new Setting(containerEl).setName('Typst templates').setHeading();

    // List existing templates
    for (const tpl of this.plugin.settings.templates) {
      const langBadge = tpl.languages.length > 0
        ? `${tpl.path}  ·  ${tpl.languages.join(', ')}`
        : tpl.path;
      new Setting(containerEl)
        .setName(tpl.name)
        .setDesc(langBadge)
        .addButton(btn =>
          btn.setButtonText('Remove')
            .onClick(async () => {
              this.plugin.settings.templates = (
                this.plugin.settings.templates              ).filter(t => t.name !== tpl.name);
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
            const already = this.plugin.settings.templates
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
            this.plugin.settings.templates.push({
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
        for (const tpl of this.plugin.settings.templates) {
          dd.addOption(tpl.name, tpl.name);
        }
        dd.setValue(this.plugin.settings.defaultTemplate)
          .onChange(async v => {
            this.plugin.settings.defaultTemplate = v;
            await this.plugin.saveSettings();
            this.display();
          });
      });

    // ── Export ───────────────────────────────────────────────────────────────
    new Setting(containerEl).setName('Export').setHeading();

    // Typst compiler info row
    const status = this.getTypstStatus();
    let typstLabel: string;
    let typstDesc: string;

    if (status.source === 'system') {
      typstLabel = `Typst ${status.version} (system)`;
      typstDesc = status.path ? `System binary: ${status.path}` : 'Found in PATH';
    } else {
      typstLabel = 'Typst not found';
      typstDesc = 'PDF export falls back to .typ — install Typst from typst.app to enable PDF.';
    }

    new Setting(containerEl)
      .setName(typstLabel)
      .setDesc(typstDesc);

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
    new Setting(containerEl).setName('Document defaults').setHeading();

    const allLanguages: Record<string, string> = {
      en: 'English (en)',
      nl: 'Nederlands (nl)',
      de: 'Deutsch (de)',
      es: 'Español (es)',
      fr: 'Français (fr)',
    };
    const activeTpl = this.plugin.settings.templates
      .find(t => t.name === this.plugin.settings.defaultTemplate);
    const availableLanguages = (activeTpl && activeTpl.languages.length > 0)
      ? activeTpl.languages
      : Object.keys(allLanguages);

    // Auto-correct stored language if no longer in the available set
    if (!availableLanguages.includes(this.plugin.settings.defaultLanguage)) {
      this.plugin.settings.defaultLanguage = availableLanguages[0];
      void this.plugin.saveSettings();
    }

    const langDesc = activeTpl && activeTpl.languages.length > 0
      ? 'Languages supported by the selected template.'
      : 'Used when the note has no language: frontmatter key.';

    new Setting(containerEl)
      .setName('Default language')
      .setDesc(langDesc)
      .addDropdown(dd => {
        for (const code of availableLanguages) {
          dd.addOption(code, allLanguages[code] ?? code);
        }
        dd.setValue(this.plugin.settings.defaultLanguage)
          .onChange(async v => {
            this.plugin.settings.defaultLanguage = v;
            await this.plugin.saveSettings();
          });
      });

    new Setting(containerEl)
      .setName('Frontmatter template source')
      .setDesc('How the "insert omd2typst frontmatter" command obtains the list of keys to insert.')
      .addDropdown(dd =>
        dd.addOption('inline', 'Inline editor')
          .addOption('file', 'Template file')
          .addOption('user-defined', 'User defined')
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
        .setDesc('YAML keys to insert into the active note. Existing keys are never overwritten.')
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
        .setDesc('Markdown file whose frontmatter keys are inserted into the active note. Existing keys are never overwritten.')
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

    if (this.plugin.settings.frontmatterTemplateMode === 'user-defined') {
      new Setting(containerEl)
        .setName('User defined')
        .setDesc('The built-in frontmatter command is disabled. Use templater, the templates core plugin, or any other tool to manage frontmatter.');
    }
  }
}
