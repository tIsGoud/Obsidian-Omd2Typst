import { App, PluginSettingTab, Setting } from 'obsidian';

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

export class Omd2TypstSettingTab extends PluginSettingTab {
  plugin: any;
  constructor(app: App, plugin: any) {
    super(app, plugin);
    this.plugin = plugin;
  }
  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    // Section 1: Default output format
    new Setting(containerEl)
      .setName('Default output format')
      .setDesc('Format used by the palette commands.')
      .addDropdown(dd =>
        dd.addOption('typ', 'Typst source (.typ)')
          .addOption('pdf', 'PDF')
          .setValue(this.plugin.settings.defaultOutputFormat)
          .onChange(async v => {
            this.plugin.settings.defaultOutputFormat = v as OutputFormat;
            await this.plugin.saveSettings();
          })
      );

    // Section 2: Output location
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
          })
      );

    // Section 3: Output folder (only when outputMode = 'fixed-folder')
    if (this.plugin.settings.outputMode === 'fixed-folder') {
      new Setting(containerEl)
        .setName('Output folder')
        .setDesc('Vault-relative path (e.g. exports/).')
        .addText(text =>
          text.setValue(this.plugin.settings.outputFolder)
            .onChange(async v => {
              this.plugin.settings.outputFolder = v;
              await this.plugin.saveSettings();
            })
        );
    }

    // Section 4: Default language
    new Setting(containerEl)
      .setName('Default language')
      .setDesc('Used when the note has no language: frontmatter key.')
      .addDropdown(dd =>
        dd.addOption('en', 'English (en)')
          .addOption('nl', 'Nederlands (nl)')
          .setValue(this.plugin.settings.defaultLanguage)
          .onChange(async v => {
            this.plugin.settings.defaultLanguage = v;
            await this.plugin.saveSettings();
          })
      );

    // Section 5: Frontmatter template source
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
          })
      );

    // Section 6: Inline frontmatter (only when frontmatterTemplateMode = 'inline')
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

    // Section 7: Frontmatter file (only when frontmatterTemplateMode = 'file')
    if (this.plugin.settings.frontmatterTemplateMode === 'file') {
      new Setting(containerEl)
        .setName('Frontmatter template file')
        .setDesc('Vault-relative path to a .md file whose frontmatter is used as the template.')
        .addText(text =>
          text.setValue(this.plugin.settings.frontmatterFilePath)
            .onChange(async v => {
              this.plugin.settings.frontmatterFilePath = v;
              await this.plugin.saveSettings();
            })
        );
    }
  }
}
