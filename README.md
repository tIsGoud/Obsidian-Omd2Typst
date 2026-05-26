# Obsidian-Omd2Typst

An [Obsidian](https://obsidian.md) plugin that exports notes to publication-quality PDFs via [Typst](https://typst.app), using the [omd2typst](https://github.com/tisgoud/Omd2Typst) Markdown-to-Typst conversion engine.

---

## Requirements

- **Obsidian** 1.4.0 or later (desktop only — macOS, Windows, Linux)
- **typst** installed and available on your system ([install guide](https://typst.app/docs/))
  - The plugin checks for `typst` in `PATH` on startup and shows a notice if it is not found
  - Common locations searched automatically: `/opt/homebrew/bin/typst`, `~/.cargo/bin/typst`, `/usr/local/bin/typst`

---

## Installation

1. Download `omd2typst-vX.Y.Z.zip` from the [latest release](https://github.com/tIsGoud/Obsidian-Omd2Typst/releases/latest)
2. Unzip into `.obsidian/plugins/` inside your vault — the zip extracts as a folder named `obsidian-omd2typst`
3. In Obsidian: Settings → Community plugins → enable **Omd2Typst**

The folder structure inside `.obsidian/plugins/obsidian-omd2typst/` should be:

```
main.js
manifest.json
```

The conversion engine (omd2typst WASM) is bundled directly inside `main.js` — no additional files are required.

---

## Features

- Export the active note as **Typst source (`.typ`)** or **PDF** from the command palette or right-click file menu
- **Template support** — configure named templates (`.typ` files in your vault) with a selectable default; supported languages are detected automatically from the template's `_lang_strings` dictionary
- **Language-aware default language** — the *Default language* dropdown shows only the languages supported by the selected default template
- **Frontmatter insertion** — insert a configurable YAML frontmatter block into any note via the *Insert omd2typst frontmatter* command, merging with existing keys without overwriting them
- **Export built-in template** — write the built-in `.typ` template to your vault root as a customisation starting point
- **Output location modes** — same folder as note, fixed folder (with vault folder autocomplete), or ask every time

---

## How it works

```
Note (.md)
    │
    ▼
omd2typst.wasm          Markdown → Typst source (in memory)
    │
    ├──► write .typ      (Typst source export)
    │
    └──► write .typ  (intermediate)
          │
          └──► typst compile --root <vault>  →  PDF  →  write .pdf  →  remove .typ
```

The omd2typst WASM module handles Markdown parsing and Typst source generation. PDF compilation uses the user's installed `typst` binary via `child_process`, with `--root <vault>` so vault-relative template `#import` paths resolve correctly.

---

## Commands

| Command | Palette | Right-click |
|---|---|---|
| Export as PDF | ✓ | ✓ |
| Export as Typst source (.typ) | ✓ | ✓ |
| Insert omd2typst frontmatter | ✓ | — |
| Export built-in template | ✓ | — |

---

## Settings

### Typst templates

| Setting | Description |
|---|---|
| **Template list** | Each registered template shows its name, vault-relative path, and the languages detected from its `_lang_strings` dictionary. |
| **Add template** | Select a `.typ` file from the vault using the autocomplete picker. The name is auto-filled from the filename and can be edited before adding. |
| **Default template** | Used for right-click exports and as the pre-selected option in palette exports. Changing this also updates the available *Default language* options. |

### Export

| Setting | Description |
|---|---|
| **Default output format** | `PDF` or `Typst source (.typ)`. |
| **Output location** | *Same folder as note* / *Fixed folder* (vault folder autocomplete) / *Ask every time*. |

### Document defaults

| Setting | Description |
|---|---|
| **Default language** | Applied when the note has no `language:` frontmatter key. Options are limited to the languages supported by the selected default template. All five languages (`en`, `nl`, `de`, `es`, `fr`) are available when the built-in template is selected. If the stored language is not supported by a newly selected template, it resets to the first available language. |
| **Frontmatter template source** | Controls how the *Insert omd2typst frontmatter* command works — see below. |

#### Frontmatter template source modes

| Mode | Behaviour |
|---|---|
| **Inline editor** | Edit `key: value` lines directly in settings. Running the command inserts any missing keys (with their default values) into the active note's frontmatter. Existing keys are never overwritten. |
| **Template file** | Select a `.md` file in the vault. The command reads that file's frontmatter and inserts missing keys (with their values) into the active note. |
| **User defined** | The built-in insert command is disabled. Use Templater, the Templates core plugin, or any other frontmatter tool of your choice. |

---

## Template authoring

Templates are standard Typst files that export a `template` function and a `callout` function consumed by omd2typst.

**Language support** is declared by defining a `_lang_strings` dictionary with a top-level entry per supported language code:

```typst
#let _lang_strings = (
  "nl": ( toc: "Inhoudsopgave", ... ),
  "en": ( toc: "Table of Contents", ... ),
)
```

The plugin detects the supported languages automatically — no separate comment or annotation is needed. The language codes found in `_lang_strings` appear as the language badge in the template list and limit the *Default language* dropdown when that template is selected.

To start from the built-in template, run the *Export built-in template* command — it writes `omd2typst-template.typ` to the vault root.

---

## Project structure

```
src/
  main.ts           — plugin lifecycle, commands, context menus
  settings.ts       — settings types, defaults, and settings tab UI
  exporter.ts       — export pipeline: read note → WASM → write output
  frontmatter.ts    — frontmatter parse, merge, and insert logic
  template.ts       — template language detection and resolution
  output.ts         — output path resolution for all three output modes
  typst-cli.ts      — findTypstBinary, checkTypstInstalled, compileToPdfViaCli
  wasm/
    omd2typst.ts    — lazy-init wrapper around omd2typst WASM
    omd2typst-pkg/  — generated by wasm-pack (gitignored; WASM bundled into main.js at build)
libs/
  omd2typst/        — git submodule: omd2typst Rust repo (pinned commit)
scripts/
  build-wasm.sh     — runs wasm-pack inside the submodule
```

---

## Building

```bash
git submodule update --init       # pull omd2typst Rust source
./scripts/build-wasm.sh           # wasm-pack build → src/wasm/omd2typst-pkg/
npm install                        # dev dependencies
npm run build                      # esbuild → main.js (WASM bundled in)
npm test                           # Jest unit tests
```

### Install into a vault (development)

```bash
VAULT=~/path/to/your/vault
mkdir -p "$VAULT/.obsidian/plugins/obsidian-omd2typst"
cp main.js manifest.json "$VAULT/.obsidian/plugins/obsidian-omd2typst/"
```

Then enable the plugin in Obsidian → Settings → Community Plugins.

---

## Supported Markdown features

See the [omd2typst README](https://github.com/tIsGoud/Omd2Typst) for the full list of supported Markdown and Obsidian features, callout types, checkbox variants, frontmatter keys, and template authoring guide.
