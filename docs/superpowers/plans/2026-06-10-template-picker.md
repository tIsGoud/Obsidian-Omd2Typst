# Template Picker at Export Time — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let users choose a template at export time via a modal list, with live-updating command names and a configurable context menu.

**Architecture:** Add two boolean settings (`showContextMenu`, `showBuiltinInPicker`). Extract `exportCommandName` helper to `template.ts`. Create `TemplateSuggestModal` in `src/template-picker.ts`. Update `main.ts` to hold command references for live name updates, register two new `checkCallback` commands, gate file-menu items on the new setting.

**Tech Stack:** TypeScript, Obsidian Plugin API (`SuggestModal`, `Command`), Jest

---

## Files

| Action | Path | Purpose |
|--------|------|---------|
| Modify | `src/settings.ts` | Add `showContextMenu`, `showBuiltinInPicker`; add toggle rows |
| Modify | `src/template.ts` | Add `exportCommandName` helper |
| Create | `src/template-picker.ts` | `TemplateSuggestModal` |
| Modify | `src/main.ts` | Command references, new commands, file menu gate |
| Modify | `tests/template.test.ts` | Tests for `exportCommandName`; update `SETTINGS_BASE` |

---

## Task 1: Add settings fields and toggle rows

**Files:**
- Modify: `src/settings.ts`
- Modify: `tests/template.test.ts` (update `SETTINGS_BASE` to satisfy TypeScript)

- [ ] **Step 1: Add the two new fields to `Omd2TypstSettings` in `src/settings.ts`**

  The interface currently ends with `frontmatterFilePath: string;`. Add after it:

  ```typescript
  export interface Omd2TypstSettings {
    templates: TemplateEntry[];
    defaultTemplate: string;
    defaultOutputFormat: OutputFormat;
    outputMode: OutputMode;
    outputFolder: string;
    defaultLanguage: string;
    frontmatterTemplateMode: FrontmatterTemplateMode;
    frontmatterInline: string;
    frontmatterFilePath: string;
    /** Show Omd2Typst items in the right-click file menu. */
    showContextMenu: boolean;
    /** Include the built-in template in the "Export with template" picker. */
    showBuiltinInPicker: boolean;
  }
  ```

- [ ] **Step 2: Add defaults to `DEFAULT_SETTINGS`**

  `DEFAULT_SETTINGS` currently ends with `frontmatterFilePath: '',`. Add after it:

  ```typescript
  showContextMenu: true,
  showBuiltinInPicker: false,
  ```

- [ ] **Step 3: Add two toggle rows to the Export section in `Omd2TypstSettingTab.display()`**

  Find the comment `// ── Document defaults` (around line 366). Insert the two rows immediately before it:

  ```typescript
    new Setting(containerEl)
      .setName('Show context menu items')
      .setDesc('Show Omd2Typst export options in the right-click file menu.')
      .addToggle(toggle =>
        toggle.setValue(this.plugin.settings.showContextMenu)
          .onChange(async v => {
            this.plugin.settings.showContextMenu = v;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName('Show built-in template in picker')
      .setDesc('Include the built-in template in the "Export with template" list.')
      .addToggle(toggle =>
        toggle.setValue(this.plugin.settings.showBuiltinInPicker)
          .onChange(async v => {
            this.plugin.settings.showBuiltinInPicker = v;
            await this.plugin.saveSettings();
          })
      );

    // ── Document defaults ────────────────────────────────────────────────────
  ```

- [ ] **Step 4: Update `SETTINGS_BASE` in `tests/template.test.ts` to include the new fields**

  `SETTINGS_BASE` is used as a `Omd2TypstSettings` — TypeScript will reject it without the new fields. Add both at the end of the object:

  ```typescript
  const SETTINGS_BASE: Omd2TypstSettings = {
    templates: [],
    defaultTemplate: 'built-in',
    defaultOutputFormat: 'pdf',
    outputMode: 'same-folder',
    outputFolder: 'exports',
    defaultLanguage: 'en',
    frontmatterTemplateMode: 'inline',
    frontmatterInline: '',
    frontmatterFilePath: '',
    showContextMenu: true,
    showBuiltinInPicker: false,
  };
  ```

- [ ] **Step 5: Run tests to confirm nothing broke**

  ```bash
  cd /Users/albert/Projects/Omd2Typst@Github/obsidian-omd2typst && npm test 2>&1 | tail -8
  ```

  Expected: `27 passed, 27 total`

---

## Task 2: Add `exportCommandName` helper and tests (TDD)

**Files:**
- Modify: `src/template.ts`
- Modify: `tests/template.test.ts`

- [ ] **Step 1: Write the failing tests in `tests/template.test.ts`**

  Add this import at the top (next to the existing imports):

  ```typescript
  import {
    parseTemplateLanguages,
    checkLanguageCompatibility,
    resolveDefaultTemplate,
    exportCommandName,
  } from '../src/template';
  ```

  Append at the end of the file:

  ```typescript
  describe('exportCommandName', () => {
    it('uses "Built-in" label when defaultTemplate is built-in', () => {
      expect(exportCommandName('PDF', SETTINGS_BASE)).toBe('Export as PDF (Built-in)');
    });

    it('uses the template name when a custom template is set', () => {
      const s = { ...SETTINGS_BASE, defaultTemplate: 'purple-template' };
      expect(exportCommandName('Typst file', s)).toBe('Export as Typst file (purple-template)');
    });
  });
  ```

- [ ] **Step 2: Run tests to confirm the new tests fail**

  ```bash
  cd /Users/albert/Projects/Omd2Typst@Github/obsidian-omd2typst && npm test 2>&1 | grep -E "FAIL|PASS|exportCommandName"
  ```

  Expected: 2 new tests fail with "exportCommandName is not a function".

- [ ] **Step 3: Add `exportCommandName` to `src/template.ts`**

  Add this import at the top of `src/template.ts`:

  ```typescript
  import type { Omd2TypstSettings } from './settings';
  ```

  Append at the end of the file:

  ```typescript
  /** Returns the command palette label for an export command, including the default template name. */
  export function exportCommandName(verb: string, settings: Omd2TypstSettings): string {
    const label = settings.defaultTemplate === 'built-in'
      ? 'Built-in'
      : settings.defaultTemplate;
    return `Export as ${verb} (${label})`;
  }
  ```

- [ ] **Step 4: Run tests to confirm all pass**

  ```bash
  cd /Users/albert/Projects/Omd2Typst@Github/obsidian-omd2typst && npm test 2>&1 | tail -6
  ```

  Expected: `29 passed, 29 total`

- [ ] **Step 5: Commit**

  ```bash
  cd /Users/albert/Projects/Omd2Typst@Github/obsidian-omd2typst
  git add src/settings.ts src/template.ts tests/template.test.ts
  git commit -m "feat: add showContextMenu/showBuiltinInPicker settings and exportCommandName helper"
  ```

---

## Task 3: Create `TemplateSuggestModal`

**Files:**
- Create: `src/template-picker.ts`

- [ ] **Step 1: Create `src/template-picker.ts`**

  ```typescript
  import { App, SuggestModal } from 'obsidian';
  import type { TemplateEntry, Omd2TypstSettings } from './settings';

  type TemplateChoice = { label: string; entry: TemplateEntry | null };

  export class TemplateSuggestModal extends SuggestModal<TemplateChoice> {
    private items: TemplateChoice[];
    private onPick: (entry: TemplateEntry | null) => void;

    constructor(
      app: App,
      settings: Omd2TypstSettings,
      onPick: (entry: TemplateEntry | null) => void,
    ) {
      super(app);
      this.onPick = onPick;
      const choices: TemplateChoice[] = [];
      if (settings.showBuiltinInPicker) {
        choices.push({ label: 'Built-in', entry: null });
      }
      for (const tpl of settings.templates) {
        choices.push({ label: tpl.name, entry: tpl });
      }
      this.items = choices;
    }

    getSuggestions(_query: string): TemplateChoice[] {
      return this.items;
    }

    renderSuggestion(choice: TemplateChoice, el: HTMLElement): void {
      el.setText(choice.label);
    }

    onChooseSuggestion(choice: TemplateChoice, _evt: MouseEvent | KeyboardEvent): void {
      this.onPick(choice.entry);
    }
  }
  ```

- [ ] **Step 2: Run lint and tests**

  ```bash
  cd /Users/albert/Projects/Omd2Typst@Github/obsidian-omd2typst && npm run lint && npm test 2>&1 | tail -6
  ```

  Expected: lint clean, `29 passed, 29 total`

- [ ] **Step 3: Commit**

  ```bash
  cd /Users/albert/Projects/Omd2Typst@Github/obsidian-omd2typst
  git add src/template-picker.ts
  git commit -m "feat: add TemplateSuggestModal for template picker"
  ```

---

## Task 4: Update `main.ts` — command names, new commands, file menu

**Files:**
- Modify: `src/main.ts`

- [ ] **Step 1: Update imports at the top of `src/main.ts`**

  Replace the existing first line imports:

  ```typescript
  import { Plugin, TFile, TAbstractFile, Notice, normalizePath, Menu, MenuItem, Command } from 'obsidian';
  import { Omd2TypstSettings, DEFAULT_SETTINGS, OutputFormat, Omd2TypstSettingTab } from './settings';
  import { resolveDefaultTemplate, exportCommandName } from './template';
  import { mergeFrontmatter, buildFrontmatterBlock, parseFrontmatter } from './frontmatter';
  import { exportNote } from './exporter';
  import { detectSystemTypst, TypstStatus } from './typst-cli';
  import { getBuiltinTemplate } from './wasm/omd2typst';
  import { TemplateSuggestModal } from './template-picker';
  ```

- [ ] **Step 2: Add command reference fields to the class**

  Inside the class body, after `typstStatus: TypstStatus = { source: 'none', version: '' };`, add:

  ```typescript
  private cmdExportPdf: Command | undefined;
  private cmdExportTyp: Command | undefined;
  ```

- [ ] **Step 3: Replace the two existing export command registrations with reference-storing versions**

  Replace:
  ```typescript
    this.addCommand({
      id: 'export-pdf',
      name: 'Export as PDF',
      callback: () => this.exportActiveNote('pdf'),
    });

    this.addCommand({
      id: 'export-typ',
      name: 'Export as typst source (.typ)',
      callback: () => this.exportActiveNote('typ'),
    });
  ```

  With:
  ```typescript
    this.cmdExportPdf = this.addCommand({
      id: 'export-pdf',
      name: exportCommandName('PDF', this.settings),
      callback: () => this.exportActiveNote('pdf'),
    });

    this.cmdExportTyp = this.addCommand({
      id: 'export-typ',
      name: exportCommandName('Typst file', this.settings),
      callback: () => this.exportActiveNote('typ'),
    });
  ```

- [ ] **Step 4: Register the two new "with template" commands after the existing four**

  After the `export-builtin-template` command registration, add:

  ```typescript
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
      name: 'Export as Typst file with template…',
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
  ```

- [ ] **Step 5: Replace the file menu registration block**

  Replace the entire `this.registerEvent(this.app.workspace.on('file-menu', ...))` block with:

  ```typescript
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
          item.setTitle('Export as Typst file')
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
            item.setTitle('Export as Typst file with template…')
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
  ```

- [ ] **Step 6: Add optional `templateOverride` parameter to `exportFile`**

  Replace:
  ```typescript
  private async exportFile(file: TFile, format: OutputFormat) {
    try {
      const template = resolveDefaultTemplate(this.settings);
  ```

  With:
  ```typescript
  private async exportFile(file: TFile, format: OutputFormat, templateOverride?: TemplateEntry | null) {
    try {
      const template = templateOverride !== undefined ? templateOverride : resolveDefaultTemplate(this.settings);
  ```

  Also add the missing import — `TemplateEntry` must be imported from settings. Update the settings import line:

  ```typescript
  import { Omd2TypstSettings, DEFAULT_SETTINGS, OutputFormat, Omd2TypstSettingTab, TemplateEntry } from './settings';
  ```

- [ ] **Step 7: Update `saveSettings` to refresh command names live**

  Replace:
  ```typescript
  async saveSettings() {
    await this.saveData(this.settings);
  }
  ```

  With:
  ```typescript
  async saveSettings() {
    await this.saveData(this.settings);
    if (this.cmdExportPdf) this.cmdExportPdf.name = exportCommandName('PDF', this.settings);
    if (this.cmdExportTyp) this.cmdExportTyp.name = exportCommandName('Typst file', this.settings);
  }
  ```

- [ ] **Step 8: Run lint and tests**

  ```bash
  cd /Users/albert/Projects/Omd2Typst@Github/obsidian-omd2typst && npm run lint && npm test 2>&1 | tail -6
  ```

  Expected: lint clean, `29 passed, 29 total`

- [ ] **Step 9: Build the plugin to confirm it compiles**

  ```bash
  cd /Users/albert/Projects/Omd2Typst@Github/obsidian-omd2typst && node esbuild.config.mjs production 2>&1
  ```

  Expected: `main.js  ~1.8mb` with no errors.

- [ ] **Step 10: Commit**

  ```bash
  cd /Users/albert/Projects/Omd2Typst@Github/obsidian-omd2typst
  git add src/main.ts
  git commit -m "feat: template picker commands, live command names, context menu gate"
  ```

---

## Task 5: Release plugin v0.8.15

**Files:**
- Modify: `manifest.json` — version `0.8.14` → `0.8.15`
- Modify: `package.json` — version `0.8.14` → `0.8.15`
- Modify: `RELEASE_NOTES.md`

- [ ] **Step 1: Bump versions**

  In `manifest.json`, change:
  ```json
  "version": "0.8.15"
  ```

  In `package.json`, change:
  ```json
  "version": "0.8.15"
  ```

- [ ] **Step 2: Add release notes**

  Prepend after the `# Release Notes` heading in `RELEASE_NOTES.md`:

  ```markdown
  ## v0.8.15 — Template picker at export time

  Choose a template when exporting instead of always using the default:

  - **Export as PDF (template-name)** and **Export as Typst file (template-name)** — existing commands now show the active default template name; the name updates live when the default is changed in settings.
  - **Export as PDF with template…** and **Export as Typst file with template…** — new commands that open a template picker. Only visible in the command palette when at least one custom template is registered.
  - **Show context menu items** — new setting to show or hide all Omd2Typst options in the right-click file menu.
  - **Show built-in template in picker** — new setting (default off) to include the built-in template in the picker list.

  ---
  ```

- [ ] **Step 3: Commit, tag, and push**

  ```bash
  cd /Users/albert/Projects/Omd2Typst@Github/obsidian-omd2typst
  git add manifest.json package.json RELEASE_NOTES.md
  git commit -m "v0.8.15 — template picker at export time"
  git tag 0.8.15
  git push && git push --tags
  ```
