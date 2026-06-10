# Design: Template Picker at Export Time

**Date:** 2026-06-10
**Status:** Approved

## Problem

The plugin always exports using the default template set in settings. Users who work with multiple document types (e.g. a report template and a memo template) must change the default in settings before each export. A template picker at export time lets them choose the template per export without touching settings.

## User-facing behaviour

- Existing export commands show the current default template name in their label:
  - `Export as PDF (Built-in)` or `Export as PDF (purple-template)`
  - `Export as Typst file (Built-in)` or `Export as Typst file (tig-template)`
  - Names update live when the user changes the default template in settings — no reload required.

- Two new commands appear in the command palette **only** when at least one custom template is registered:
  - `Export as PDF with template…`
  - `Export as Typst file with template…`
  - Invoking either opens a modal listing templates; the export runs with the chosen template.
  - A new **Show built-in template in picker** setting controls whether the built-in template appears in this list. Default: off — users working with custom templates should not have the built-in cluttering the list.

- All four export items appear in the right-click file menu, gated on a new **Show context menu items** setting. The two "with template" items additionally require at least one custom template.

## Scope

Plugin-only — no changes to the omd2typst Rust crate or WASM bundle.

## Files

| Action | Path | Purpose |
|--------|------|---------|
| Create | `src/template-picker.ts` | `TemplateSuggestModal` class |
| Modify | `src/settings.ts` | Add `showContextMenu` and `showBuiltinInPicker` booleans; add toggle rows in Export section |
| Modify | `src/main.ts` | Hold command references for live name updates; register new commands; apply context menu gate |

## Design

### `src/settings.ts`

Add to `Omd2TypstSettings` interface and `DEFAULT_SETTINGS`:

```typescript
showContextMenu: boolean;     // default: true
showBuiltinInPicker: boolean; // default: false
```

Add two toggle rows in the **Export** section of `Omd2TypstSettingTab.display()`, after the output location row:

> **Show context menu items**
> *Show Omd2Typst export options in the right-click file menu.*

> **Show built-in template in picker**
> *Include the built-in template in the "Export with template" list. Turn on if you want to switch to the built-in from the picker without changing the default.*

### `src/template-picker.ts`

```typescript
type TemplateChoice = { label: string; entry: TemplateEntry | null };
```

`TemplateSuggestModal extends SuggestModal<TemplateChoice>`:

- **Constructor:** `(app, settings, onPick)` — `onPick: (entry: TemplateEntry | null) => void`
- **`getSuggestions(_query)`:** ignores query, returns:
  - `{ label: 'Built-in', entry: null }` first — **only** when `settings.showBuiltinInPicker` is `true`
  - then `settings.templates.map(t => ({ label: t.name, entry: t }))`
- **`renderSuggestion(choice, el)`:** sets `el.setText(choice.label)`
- **`onChooseSuggestion(choice)`:** calls `onPick(choice.entry)`

The `null` entry convention matches the existing `exportNote` signature and `resolveDefaultTemplate` return value throughout `main.ts` and `exporter.ts`.

### `src/main.ts`

**Helper function** (module-level, pure):

```typescript
function exportCommandName(verb: string, ext: string, settings: Omd2TypstSettings): string {
  const label = settings.defaultTemplate === 'built-in'
    ? 'Built-in'
    : settings.defaultTemplate;
  return `Export as ${verb} (${label})`;
}
// e.g. exportCommandName('PDF', 'pdf', settings) → 'Export as PDF (Built-in)'
// e.g. exportCommandName('Typst file', 'typ', settings) → 'Export as Typst file (tig-template)'
```

**Command registration:**

Store references to the two existing export commands:

```typescript
private cmdExportPdf: Command;
private cmdExportTyp: Command;
```

Set `name` at registration via `exportCommandName`. After `this.saveSettings()` completes, call:

```typescript
this.cmdExportPdf.name = exportCommandName('PDF', 'pdf', this.settings);
this.cmdExportTyp.name = exportCommandName('typst source (.typ)', 'typ', this.settings);
```

**New commands** use `checkCallback`:

```typescript
this.addCommand({
  id: 'export-pdf-pick-template',
  name: 'Export as PDF with template…',
  checkCallback: (checking) => {
    if (this.settings.templates.length < 1) return false;
    if (!checking) { /* open modal */ }
    return true;
  },
});
// mirror for export-typ-pick-template with name: 'Export as Typst file with template…'
```

The modal callback: `new TemplateSuggestModal(this.app, this.settings, (entry) => this.exportActiveNote('pdf', entry)).open()`

`exportActiveNote` gains an optional `templateOverride?: TemplateEntry | null` parameter. When provided it takes precedence over `resolveDefaultTemplate(settings)`.

**File menu:**

Gate the entire `file-menu` registration block on `this.settings.showContextMenu`. The two "with template" items additionally check `this.settings.templates.length >= 1`.

## Testing

**New unit test** for `exportCommandName` in `tests/template.test.ts`:

| Input | Expected |
|-------|----------|
| `defaultTemplate: 'built-in'` | `'Export as PDF (Built-in)'` |
| `defaultTemplate: 'purple-template'` | `'Export as PDF (purple-template)'` |

`TemplateSuggestModal` wraps Obsidian's `SuggestModal` (DOM-dependent) — not unit tested.

The `showContextMenu` and `showBuiltinInPicker` settings are boolean gates with no logic to test beyond the existing mock infrastructure.

## Out of scope

- Remembering the last-used template across exports
- Per-note template persistence (e.g. in frontmatter)
- Any changes to the omd2typst Rust crate or WASM bundle
