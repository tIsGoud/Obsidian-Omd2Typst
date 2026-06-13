# Release Notes

## v0.8.24 — Disable Path A: revert to the internal evaluator

The v0.8.23 Path A prototype (rendering bases via Obsidian's MarkdownRenderer)
caused binary garbage to leak into the Typst source on some notes, breaking
PDF compilation. Path A is now disabled; bases are queried by the internal
evaluator only — same behaviour as v0.8.22.

The Path A code remains in `src/bases.ts` (dormant) so it can be investigated
behind a feature flag in a future release.

---

## v0.8.23 — Bases: render via Obsidian's own engine (Path A prototype)

Each `![[file.base]]` embed is now rendered through Obsidian's `MarkdownRenderer` into a hidden DOM element; the resulting `<table>` is read back as a Markdown table. This gives full filter-language support — every operator Obsidian's Bases supports works automatically because Obsidian itself is doing the query.

The internal evaluator from v0.8.20–v0.8.22 remains as a fallback: if the headless render fails or times out (5s), the old code path kicks in.

Trade-off: rendering depends on Obsidian's UI being able to draw the table off-screen; behaviour during fast-fire exports has not yet been stress-tested.

---

## v0.8.22 — Fix Obsidian review warning: eslint-disable directive without description

Added a description to the `@typescript-eslint/no-base-to-string` suppression in `cellValue` so the Obsidian community store review bot accepts it. No functional change.

---

## v0.8.21 — Bases output now matches Obsidian's display

Two fixes to align the rendered base table with what Obsidian shows on screen:

- `file.*` column headers now render as `file name`, `file path`, `file ext`, `file tags` (matching Obsidian's labels) instead of `name`, `path`, etc.
- Columns whose values are empty for every matching row are now dropped from the output, mirroring Obsidian's UI behaviour of hiding columns with no data.

---

## v0.8.20 — Obsidian Bases support

Notes that embed an Obsidian Bases view (`![[file.base]]` or `![[file.base#view-name]]`)
now render the query results as a table in exported PDFs and `.typ` files.

- Results are queried from Obsidian's in-memory metadata cache — no extra tools required.
- Supported filter operations: `file.ext`, `file.name.startsWith()`, `file.path.startsWith()`,
  `file.tags.contains()`, `file.tags.containsAny()`, property equality/inequality,
  `link()` comparisons, `and`/`or`/`!` boolean operators.
- Column headers and display names are read from the `.base` file's `properties` section.
- Only `table` view types are supported; `cards`, `calendar`, and `gallery` views are skipped
  with a notice.
- Unsupported filter expressions are skipped (treated as matching all files) with a notice.
- Use `![[file.base#view-name]]` to select a specific named view; defaults to the first view.

---

## v0.8.19 — Fix mermaid SVG cleanup for .typ export

- Mermaid SVG files are now kept alongside the note when exporting to `.typ` — they are needed when compiling the `.typ` file manually with `typst compile`.
- `mermaid.initialize()` is now called at most once per session to avoid resetting Obsidian's mermaid theme configuration on repeated exports.

---

## v0.8.18 — Mermaid diagram support

Mermaid code blocks are now rendered as diagrams in exported PDFs and `.typ` files.
The plugin uses Obsidian's own bundled mermaid library — no extra tools or packages required.

- Each ` ```mermaid ` block is rendered to SVG and embedded as an image in the export.
- If a diagram cannot be rendered (e.g. invalid syntax), that block is left as a code listing
  and a notice is shown; other diagrams in the same note still render.
- If Obsidian's mermaid library is unavailable, all blocks are left as code listings and a
  notice explains how to resolve it (usually: restart Obsidian).

---

## v0.8.17 — Fix missing plugin prefix on live-updated command names

When the default template was changed in settings, the command palette showed
"Export as PDF (DUO)" instead of "Omd2Typst: Export as PDF (DUO)". Obsidian
stores the plugin name as part of the command name after `addCommand()`; the
live-update in `saveSettings` now replicates that prefix.

---

## v0.8.16 — Fix sentence-case violations in command names

Removed `eslint-disable` suppressions for the Obsidian review linter — disabling
`obsidianmd/ui/sentence-case` is not permitted. "Typst" is now consistently
lowercase in all UI strings: `Export as typst file`, `Export as typst file with template…`.

---

## v0.8.15 — Template picker at export time

Choose a template when exporting instead of always using the default:

- **Export as PDF (template-name)** and **Export as Typst file (template-name)** — existing commands now show the active default template name; the name updates live when the default is changed in settings.
- **Export as PDF with template…** and **Export as Typst file with template…** — new commands that open a template picker. Only visible in the command palette when at least one custom template is registered.
- **Show context menu items** — new setting to show or hide all Omd2Typst options in the right-click file menu.
- **Show built-in template in picker** — new setting (default off) to include the built-in template in the picker list.

---

## v0.8.14 — Fix clippy lint; built on omd2typst v0.10.5

Internal clippy fix in the YAML block scalar parser (`map_or(false, …)` →
`is_some_and(…)`). No functional change. Resolves CI pipeline failures on
the omd2typst v0.10.3 and v0.10.4 builds.

---

## v0.8.13 — Fix `|-` chomping variant written by Obsidian's YAML editor

Obsidian's live preview automatically rewrites `summary: |` to `summary: |-`
(strip chomping) when the note is saved. The parser now accepts `|-` and `|+`
in addition to `|`, so multi-line summaries work regardless of which variant
Obsidian writes. Built on omd2typst v0.10.4.

---

## v0.8.12 — Support multi-line summary on cover page

The `summary` frontmatter field now supports multi-line text using the YAML
literal block scalar syntax:

```yaml
summary: |
  First line of the summary.
  Second line of the summary.
```

Each line is rendered as a separate line in the summary box on the PDF cover
page. Built on omd2typst v0.10.3.

---

## v0.8.11 — Add eslint-plugin-obsidianmd; fix console.log and sentence-case warnings

- `eslint-plugin-obsidianmd` added as a dev dependency — this is the exact linter used by the Obsidian community store review bot; `npm run lint` now catches review issues before submission
- Pre-commit git hook added: runs `npm run lint && npm test` on every commit
- `console.log` removed from `main.ts` (typst detection status) and `typst-cli.ts` (CLI compile command)
- UI strings corrected to sentence case: `'Export as typst source (.typ)'`, `'Export as typst source'`, `'Frontmatter insertion is set to user defined…'`, and the settings descriptions

---

## v0.8.10 — Fix remaining review warnings from Obsidian store

- Redundant `as TemplateEntry[]` casts removed from all six remaining call sites in `settings.ts` — `plugin.settings.templates` is already typed as `TemplateEntry[]` via the `PluginHost` interface
- `.setWarning()` removed from the Remove button — the method is deprecated in future Obsidian versions and `setDestructive()` (the replacement) is not yet available in the minimum supported version (1.7.2); the button is now unstyled

---

## v0.8.9 — Fix remaining TypeScript lint errors from Obsidian review

- `setDestructive()` (not available in 1.7.2) reverted to `setWarning()` on the Remove button
- `FileSystemAdapter.basePath` replaced with `getBasePath()` method (the typed API)
- `Uint8Array.buffer` cast to `ArrayBuffer` for `writeBinary()` (buffer is `ArrayBufferLike` in TypeScript lib)
- `loadData()` cast to `Partial<Omd2TypstSettings>` to remove unsafe `any` assignment
- `this.inputEl` (unresolvable type on parent class) replaced with own `el: HTMLInputElement` field in all three suggest classes
- Redundant `as TemplateEntry[]` casts removed — now that `plugin` is typed via `PluginHost` interface, `settings.templates` is already `TemplateEntry[]`
- Type declaration file added for wasm-pack background glue (`omd2typst_wasm_bg.d.ts`) so `render_to_typst`, `get_builtin_template`, and `__wbg_set_wasm` are properly typed; redundant `as WebAssembly.Exports` and `as string` assertions removed

---

## v0.8.8 — Fix TypeScript lint errors from Obsidian review

Resolves all errors and warnings flagged by the Obsidian community store review:

- `eslint-disable-next-line` comments now include descriptions explaining why the suppression is necessary
- `FileSystemAdapter` used directly instead of `any` cast for `basePath`; binary PDF written via `writeBinary()` instead of casting `write()`
- `vault.getAllFolders()` (added in 1.7.2) replaced with vault-root traversal for compatibility
- `AbstractInputSuggest.setValue()` replaced with direct `inputEl.value` assignment
- `plugin: any` in settings replaced with a typed `PluginHost` interface
- Section headings use `Setting.setHeading()` instead of raw `createEl('h3')`
- `setWarning()` replaced with `setDestructive()` on the Remove button
- Floating promises marked with `void`; async `onPick` callbacks typed as `void | Promise<void>`
- Unnecessary `as Buffer` assertion removed; WASM glue calls typed with explicit assertions
- Command name "Insert omd2typst frontmatter" shortened to "Insert frontmatter" (plugin name already shown in UI)
- `minAppVersion` bumped to `1.7.2`

---

## v0.8.7 — Register .typ extension with the vault

`.typ` files are now visible in the Obsidian vault navigator and file pickers without enabling *Show all file types*. Files open in Obsidian's text editor; for a richer editing experience use an external code editor.

---

## v0.8.6 — Add artifact attestations

Release assets (`main.js`, `manifest.json`, `omd2typst-examples.zip`) now have GitHub artifact attestations. Verify provenance with:

```
gh attestation verify main.js --repo tIsGoud/Obsidian-Omd2Typst
```

---

## v0.8.5 — Replace builtin-modules with Node.js built-in

`builtin-modules` (devDependency) replaced with `builtinModules` from Node.js `module` — same functionality, no third-party package required.

---

## v0.8.4 — Fix LICENSE file recognition

Replace custom copyright preamble with canonical AGPL-3.0 text so GitHub and the Obsidian community store recognize the license correctly.

---

## v0.8.3 — Fix plugin ID (digits not allowed)

Plugin ID renamed from `omd2typst` to `omd-to-typst` — only lowercase letters and hyphens are permitted; digits are not allowed.

**Action required for manual installs:** rename your plugin folder from `.obsidian/plugins/omd2typst/` to `.obsidian/plugins/omd-to-typst/`.

---

## v0.8.2 — Fix plugin ID for Obsidian community store

Plugin ID renamed from `obsidian-omd2typst` to `omd2typst` — IDs containing "obsidian" are not permitted in the community directory.

**Action required for manual installs:** rename your plugin folder from `.obsidian/plugins/obsidian-omd2typst/` to `.obsidian/plugins/omd2typst/`.

---

## v0.8.1 — Examples download; figure list in all templates

- **`omd2typst-examples.zip`** added as a release asset — contains sample Markdown input files for all five languages, the public Typst templates (`purple-template.typ`, `tig-template.typ`), and `omd2typst-frontmatter.md` to get started quickly
- **Figure list page** added to `purple-template.typ` and `tig-template.typ` — set `figure-list: true` in frontmatter to include a numbered list of figures before the document body
- README rewritten for Obsidian community store submission with screenshots and updated settings documentation
- Typst compiler row in settings changed to a plain status indicator (was a disabled text field)

---

## v0.8.0 — Drop WASM PDF compiler; PDF requires system Typst

**PDF export now requires a system Typst installation**
The downloadable WASM PDF compiler introduced in v0.7.0 has been removed. It required every image, template file, and font to be explicitly passed across the JS/WASM boundary — a fundamental constraint that caused recurring bugs (images missing, emoji absent, binary encoding overhead) and would have required bundling a ~10 MB emoji font to match CLI output quality.

PDF export now uses the system `typst` binary exclusively, which has full access to the OS filesystem and all installed fonts. If Typst is not installed and a PDF export is requested, the plugin exports a `.typ` file instead and shows a notice with a link to typst.app.

**Installing Typst**
```
brew install typst          # macOS
winget install --id Typst.Typst  # Windows
```
Or download from [typst.app](https://typst.app).

**Built on omd2typst v0.10.1**

---

## v0.7.3 — Fix images not found during WASM PDF compilation

**Image files are now included in WASM PDF export**
When compiling to PDF via the WASM fallback compiler, images referenced with `#image()` in the generated Typst source were not accessible — the compiler raised a "file not found" error for every image path. The exporter now reads all referenced image files as binary from the vault, base64-encodes them, and passes them to the WASM compiler alongside the template text.

**Cache invalidation on version bump**
The cached WASM binary filename now includes the release version (e.g. `omd2typst-pdf-compiler-v0.10.1.wasm`). Upgrading the plugin will automatically download the matching binary and leave the old one behind rather than silently reusing a binary whose function signatures no longer match the JS glue.

**Built on omd2typst v0.10.1**

---

## v0.7.2 — Fix WASM instantiation missing JS imports

The PDF WASM module imports callbacks from its JS glue (e.g. for string-to-JS conversion). These were missing from the instantiation call, causing a `LinkError`. The full JS glue module is now passed as the import namespace so all required functions are available.

---

## v0.7.1 — Fix WASM download blocked by CORS

`fetch()` is blocked by Obsidian's renderer CORS policy when downloading from GitHub. Switched to Obsidian's `requestUrl()` API, which routes through Electron's main process and is not subject to CORS restrictions.

---

## v0.7.0 — WASM PDF fallback; Typst version shown in settings

**PDF export no longer requires a system typst installation**
The plugin now detects the system `typst` binary at startup and falls back to a downloadable WASM compiler if it is not found. On the first PDF export without system `typst`, the WASM compiler (~27 MB) is downloaded from the omd2typst GitHub release and cached in the vault — subsequent exports use the cache with no further network access.

**Typst compiler status in settings**
The *Export* section of the settings panel now shows a read-only *Typst compiler* row indicating which compiler is in use and its version:
- `Typst 0.13.1 (system)` — system binary found in PATH or a known location
- `Typst 0.13.1 (WASM, cached)` — WASM compiler already downloaded and cached
- `Typst not found` — no system binary; WASM will be downloaded on the first PDF export

**Built on omd2typst v0.10.0**

---

## v0.6.0 — WASM bundled into main.js; license corrected to AGPL-3.0

**Plugin is now fully self-contained**
The omd2typst WASM engine is embedded directly inside `main.js` via esbuild's binary loader. Installation no longer requires a separate `wasm-runtime/` folder — only `main.js` and `manifest.json` are needed.

**License corrected to AGPL-3.0-only**
Both the `LICENSE` file and `package.json` now consistently declare AGPL-3.0-only. The previous release had a mismatch (LICENSE said MIT, package.json said AGPL-3.0-only).

**Built on omd2typst v0.9.0**

---

## v0.5.0 — AGPL-3.0 license declaration; built on omd2typst v0.8.0

- License declared as AGPL-3.0-only in `package.json`
- Plugin id corrected to `obsidian-omd2typst` in manifest
- Built against omd2typst engine v0.8.0
- Author URL added to manifest

---

## v0.4.4 — README overhaul

**README rewritten to reflect current behaviour**
The README now documents the plugin as it actually works today. Corrections and additions:

- Installation section added (download zip, unzip, place in vault)
- Template language detection: corrected from the removed `// omd2typst-languages:` comment approach to the current automatic detection from `_lang_strings`
- Default language: documents the template-aware behaviour — options are limited to the languages supported by the selected default template
- Frontmatter template source: all three modes (*Inline editor*, *Template file*, *User defined*) are documented including what each one does and how values are preserved
- Template authoring section: explains how to declare language support via `_lang_strings` and how to export the built-in template as a starting point

---

## v0.4.3 — Frontmatter template values are now preserved

**Fix: default values in the frontmatter template are inserted correctly**
Previously, `key: value` lines in both the inline editor and the template file had their values stripped — only the key name survived, so the note always received an empty `key:` line regardless of what the template said. All three pipeline functions (`buildFrontmatterBlock`, `mergeFrontmatter`, `parseFrontmatter`) now preserve full `key: value` lines. Existing keys in the note are still never overwritten.

---

## v0.4.2 — Fix frontmatter insertion; add User defined mode

**Fix: "Insert omd2typst frontmatter" command now works**
Two bugs prevented the command from running at all: a missing function import caused a `ReferenceError` at runtime, and the *Template file* mode was silently ignored (always fell back to inline). Both are fixed.

**New: User defined mode**
A third option — *User defined* — is now available under *Frontmatter template source*. Selecting it disables the built-in insert command and shows a notice when the command is invoked, so users who manage frontmatter through Templater, the Templates core plugin, or any other tool can opt out of the built-in behaviour entirely.

---

## v0.4.1 — Fix language detection

Language detection now reads the `_lang_strings` dictionary directly from the `.typ` file instead of relying on a comment declaration. No changes needed in template files — any template that defines `_lang_strings` will have its supported languages detected automatically.

---

## v0.4.0 — Template language awareness

### What changed

**Language badges always visible**
When the settings panel opens, language declarations are re-read from every registered `.typ` file. Templates that were added before language parsing was introduced now show their supported languages automatically — no need to remove and re-add them.

**Default language follows the selected template**
The *Default language* dropdown now lists only the languages declared by the active default template. Switching to a different template immediately updates the available language options. When the built-in template is selected (or a template with no language declaration), all five languages are available. If the currently stored language is not supported by the newly selected template, it resets to the first available language.

---

## v0.3.0 — Settings UX improvements

### What changed

Four improvements to the settings panel:

**Folder picker for output folder**
When *Output location* is set to *Fixed folder*, the folder field now has vault-aware autocomplete. Start typing and matching vault folders appear in a dropdown.

**File picker for frontmatter template file**
When *Frontmatter template source* is set to *Template file*, the path field now has autocomplete for `.md` files in the vault — same pattern as the template file picker.

**Reactive settings panel**
Switching *Output location* or *Frontmatter template source* now immediately shows or hides the dependent field without needing to close and reopen settings.

**All five languages in the dropdown**
The *Default language* dropdown now lists all supported languages: English, Nederlands, Deutsch, Español, Français.

**Language badges on registered templates**
If a template declares which languages it supports, those language codes are shown alongside the vault path in the template list.

**Settings grouped into sections**
Settings are now organised under three headings: *Typst templates*, *Export*, and *Document defaults*.

---

## v0.2.0 — Vault file picker for template selection

### What changed

**Template selection now uses a vault-aware file picker.**

In the plugin settings, the *Add template* row previously required typing a name and a vault-relative path by hand. It has been replaced with:

- A **path field with autocomplete** — start typing and matching `.typ` files in the vault appear in a dropdown. Each suggestion shows the filename and its full vault path.
- The **name field is auto-filled** from the filename when a file is selected from the dropdown (e.g. selecting `typst/duo-template.typ` sets the name to `duo-template`). The name can still be edited before clicking Add.
- The **Add button** is now styled as a primary action button.

---

## v0.1.0 — Initial release

First public release. Converts the active Obsidian note to Typst source (`.typ`) or PDF using the omd2typst engine (v0.7.5).

**Features**

- Cover page from YAML frontmatter (`title`, `subtitle`, `author`, `date`, `version`, `status`, `summary`)
- Table of contents with numbered headings
- Revision and approval table support
- 13 callout types with Lucide SVG icons
- 10 checkbox variants with SVG icons
- Tables, images, code blocks, math, footnotes, block quotes
- Language support: `nl` (default), `en`, `de`, `es`, `fr`
- Settings: custom templates, default output format, output location, default language, frontmatter template
