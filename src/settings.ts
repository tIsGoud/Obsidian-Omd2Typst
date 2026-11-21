import { App, AbstractInputSuggest, Plugin, TFile, PluginSettingTab, Setting, TextComponent } from 'obsidian';
import type { SettingDefinitionItem } from 'obsidian';
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
    el.createDiv({ text: file.basename });
    el.createEl('small', { text: file.path });
  }

  selectSuggestion(file: TFile): void {
    this.el.value = file.path;
    this.close();
    this.onPick(file);
  }
}

// ---------------------------------------------------------------------------
// Types and defaults
// ---------------------------------------------------------------------------

export type OutputFormat = 'typ' | 'pdf';
export type OutputMode  = 'same-folder' | 'fixed-folder' | 'ask';
export type FrontmatterTemplateMode = 'inline' | 'file' | 'user-defined';
export type WikilinkMode = 'text' | 'bold' | 'link' | 'keep';

/** How embedded Excalidraw drawings are exported: as a PNG or SVG image, or not at all. */
export type ExcalidrawImageMode = 'png' | 'svg' | 'off';

/** Syntax of $…$ / $$…$$ formulas in the notes. */
export type MathSyntax = 'latex' | 'typst';

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
  /** How [[wikilinks]] are rendered in the export. */
  wikilinkMode: WikilinkMode;
  /** Syntax of math formulas: LaTeX (as Obsidian renders it) or Typst. */
  mathSyntax: MathSyntax;
  /** Image format for embedded Excalidraw drawings. */
  excalidrawImage: ExcalidrawImageMode;
  /** Caption images without alt text with their file name. */
  filenameCaptions: boolean;
  frontmatterTemplateMode: FrontmatterTemplateMode;
  /** YAML lines (no --- delimiters) used in inline mode. */
  frontmatterInline: string;
  /** Vault-relative path to a .md file used in file mode. */
  frontmatterFilePath: string;
  /** Show Omd2Typst items in the right-click file menu. */
  showContextMenu: boolean;
  /** Include the built-in template in the "Export with template" picker. */
  showBuiltinInPicker: boolean;
}

export const DEFAULT_SETTINGS: Omd2TypstSettings = {
  templates: [],
  defaultTemplate: 'built-in',
  defaultOutputFormat: 'pdf',
  outputMode: 'same-folder',
  outputFolder: 'exports',
  defaultLanguage: 'en',
  wikilinkMode: 'text',
  mathSyntax: 'latex',
  excalidrawImage: 'png',
  filenameCaptions: false,
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
  showContextMenu: true,
  showBuiltinInPicker: false,
};

// ---------------------------------------------------------------------------
// Settings tab
// ---------------------------------------------------------------------------

interface PluginHost extends Plugin {
  settings: Omd2TypstSettings;
  saveSettings(): Promise<void>;
}

const ALL_LANGUAGES: Record<string, string> = {
  en: 'English (en)',
  nl: 'Nederlands (nl)',
  de: 'Deutsch (de)',
  es: 'Español (es)',
  fr: 'Français (fr)',
};

/**
 * Settings whose value changes the *structure* of the tab (which items exist,
 * which options a dropdown offers), so the definitions must be re-read.
 * Everything else only needs the `visible` predicates re-evaluated.
 */
const STRUCTURAL_KEYS = new Set<string>(['defaultTemplate', 'outputMode', 'frontmatterTemplateMode']);

export class Omd2TypstSettingTab extends PluginSettingTab {
  private plugin: PluginHost;
  private getTypstStatus: () => TypstStatus;

  constructor(app: App, plugin: PluginHost, getTypstStatus: () => TypstStatus) {
    super(app, plugin);
    this.plugin = plugin;
    this.getTypstStatus = getTypstStatus;
  }

  /** Persist through the plugin so live command names stay in sync. */
  async setControlValue(key: string, value: unknown): Promise<void> {
    (this.plugin.settings as unknown as Record<string, unknown>)[key] = value;
    await this.plugin.saveSettings();
    if (STRUCTURAL_KEYS.has(key)) this.update();
    else this.refreshDomState();
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
      this.update();
    }
  }

  private async addTemplate(name: string, path: string): Promise<void> {
    if (!path) return;
    const finalName = name || path.split('/').pop()?.replace(/\.typ$/, '') || path;
    if (this.plugin.settings.templates.some(t => t.name === finalName)) return;
    let languages: string[] = [];
    const file = this.app.vault.getAbstractFileByPath(path);
    if (file instanceof TFile) {
      try {
        languages = parseTemplateLanguages(await this.app.vault.read(file));
      } catch { /* leave empty if unreadable */ }
    }
    this.plugin.settings.templates.push({ name: finalName, path, languages });
    await this.plugin.saveSettings();
    this.update();
  }

  private async removeTemplate(index: number): Promise<void> {
    const removed = this.plugin.settings.templates[index];
    if (!removed) return;
    this.plugin.settings.templates.splice(index, 1);
    if (this.plugin.settings.defaultTemplate === removed.name) {
      this.plugin.settings.defaultTemplate = 'built-in';
    }
    await this.plugin.saveSettings();
    this.update();
  }

  /** Add-template row: optional name + .typ file search + Add button. */
  private renderAddTemplate(setting: Setting): void {
    let newName = '';
    let newPath = '';
    let nameComp: TextComponent;

    setting
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
          .onClick(() => { void this.addTemplate(newName, newPath); })
      );
  }

  getSettingDefinitions(): SettingDefinitionItem[] {
    const settings = this.plugin.settings;
    void this.refreshTemplateLanguages();

    // Typst compiler info row
    const status = this.getTypstStatus();
    const typstLabel = status.source === 'system'
      ? `Typst ${status.version} (system)`
      : 'Typst not found';
    const typstDesc = status.source === 'system'
      ? (status.path ? `System binary: ${status.path}` : 'Found in PATH')
      : 'PDF export falls back to .typ — install Typst from typst.app to enable PDF.';

    const templateOptions: Record<string, string> = { 'built-in': 'Built-in template' };
    for (const tpl of settings.templates) templateOptions[tpl.name] = tpl.name;

    // Languages offered depend on the selected default template.
    const activeTpl = settings.templates.find(t => t.name === settings.defaultTemplate);
    const availableLanguages = (activeTpl && activeTpl.languages.length > 0)
      ? activeTpl.languages
      : Object.keys(ALL_LANGUAGES);
    const languageOptions: Record<string, string> = {};
    for (const code of availableLanguages) languageOptions[code] = ALL_LANGUAGES[code] ?? code;

    // Auto-correct stored language if no longer in the available set
    if (!availableLanguages.includes(settings.defaultLanguage)) {
      settings.defaultLanguage = availableLanguages[0];
      void this.plugin.saveSettings();
    }
    const langDesc = activeTpl && activeTpl.languages.length > 0
      ? 'Languages supported by the selected template.'
      : 'Used when the note has no language: frontmatter key.';

    return [
      {
        type: 'list',
        heading: 'Typst templates',
        emptyState: 'No templates added. The built-in template is used.',
        onDelete: (index: number) => { void this.removeTemplate(index); },
        items: settings.templates.map(tpl => ({
          name: tpl.name,
          desc: tpl.languages.length > 0
            ? `${tpl.path}  ·  ${tpl.languages.join(', ')}`
            : tpl.path,
        })),
      },
      {
        type: 'group',
        items: [
          {
            name: 'Add template',
            desc: 'Select a .typ file from the vault. Name is derived from the filename.',
            render: (setting: Setting) => this.renderAddTemplate(setting),
          },
          {
            name: 'Default template',
            desc: 'Template used when exporting without a specific template selected.',
            control: {
              type: 'dropdown',
              key: 'defaultTemplate',
              options: templateOptions,
              defaultValue: 'built-in',
            },
          },
        ],
      },
      {
        type: 'group',
        heading: 'Export',
        items: [
          { name: typstLabel, desc: typstDesc },
          {
            name: 'Default output format',
            desc: 'Format used by the palette commands.',
            control: {
              type: 'dropdown',
              key: 'defaultOutputFormat',
              options: { pdf: 'PDF', typ: 'Typst source (.typ)' },
            },
          },
          {
            name: 'Output location',
            desc: 'Where to save exported files.',
            control: {
              type: 'dropdown',
              key: 'outputMode',
              options: {
                'same-folder': 'Same folder as note',
                'fixed-folder': 'Fixed folder',
                'ask': 'Ask every time',
              },
            },
          },
          {
            name: 'Output folder',
            desc: 'Vault folder where exported files are saved.',
            visible: () => settings.outputMode === 'fixed-folder',
            control: {
              type: 'folder',
              key: 'outputFolder',
              placeholder: 'Search folders…',
              includeRoot: true,
            },
          },
          {
            name: 'Wikilinks',
            desc: 'How [[wikilinks]] appear in the export. Link: headings in the same note become ' +
              'links, and links to other notes open in Obsidian (the vault name is stored in the PDF).',
            control: {
              type: 'dropdown',
              key: 'wikilinkMode',
              options: {
                text: 'Display text',
                bold: 'Bold display text',
                link: 'Links',
                keep: 'Keep as typed',
              },
            },
          },
          {
            name: 'Math syntax',
            desc: 'Syntax of formulas between $ signs. LaTeX is what Obsidian renders and is converted ' +
              'to Typst math; choose Typst if your notes contain Typst math notation.',
            control: {
              type: 'dropdown',
              key: 'mathSyntax',
              options: {
                latex: 'LaTeX',
                typst: 'Typst',
              },
            },
          },
          {
            name: 'Excalidraw drawings',
            desc: 'How drawings embedded from the Excalidraw plugin appear in the export. They are rendered ' +
              'with the light theme. PNG looks exactly like Obsidian; SVG stays sharp when zoomed, but ' +
              'Typst cannot use the hand-drawn web font, so text falls back to a normal font.',
            control: {
              type: 'dropdown',
              key: 'excalidrawImage',
              options: {
                png: 'PNG image',
                svg: 'SVG image',
                off: 'Do not render',
              },
            },
          },
          {
            name: 'Use file name as caption',
            desc: 'Give images without alt text their file name as caption. Alt text always wins: ' +
              '![[image.png|200|alt text]] or ![alt text|200](image.png).',
            control: { type: 'toggle', key: 'filenameCaptions' },
          },
          {
            name: 'Show context menu items',
            desc: 'Show omd2typst export options in the right-click file menu.',
            control: { type: 'toggle', key: 'showContextMenu' },
          },
          {
            name: 'Show built-in template in picker',
            desc: 'Include the built-in template in the "export with template" list.',
            control: { type: 'toggle', key: 'showBuiltinInPicker' },
          },
        ],
      },
      {
        type: 'group',
        heading: 'Document defaults',
        items: [
          {
            name: 'Default language',
            desc: langDesc,
            control: { type: 'dropdown', key: 'defaultLanguage', options: languageOptions },
          },
          {
            name: 'Frontmatter template source',
            desc: 'How the "insert omd2typst frontmatter" command obtains the list of keys to insert.',
            control: {
              type: 'dropdown',
              key: 'frontmatterTemplateMode',
              options: {
                inline: 'Inline editor',
                file: 'Template file',
                'user-defined': 'User defined',
              },
            },
          },
          {
            name: 'Default frontmatter',
            desc: 'YAML keys to insert into the active note. Existing keys are never overwritten.',
            visible: () => settings.frontmatterTemplateMode === 'inline',
            control: { type: 'textarea', key: 'frontmatterInline' },
          },
          {
            name: 'Frontmatter template file',
            desc: 'Markdown file whose frontmatter keys are inserted into the active note. Existing keys are never overwritten.',
            visible: () => settings.frontmatterTemplateMode === 'file',
            control: {
              type: 'file',
              key: 'frontmatterFilePath',
              placeholder: 'Search .md files…',
              filter: (file: TFile) => file.extension === 'md',
            },
          },
          {
            name: 'User defined',
            desc: 'The built-in frontmatter command is disabled. Use templater, the templates core plugin, or any other tool to manage frontmatter.',
            visible: () => settings.frontmatterTemplateMode === 'user-defined',
          },
        ],
      },
    ];
  }
}
