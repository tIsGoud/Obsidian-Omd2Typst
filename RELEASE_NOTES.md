# Release Notes

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
