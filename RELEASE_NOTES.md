# Release Notes

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
