# Release Notes

## v0.13.1 — Add template row restored

- The **Choose file…** button on the *Add template* row is removed again: with
  four controls in one row the title and description were squeezed into a
  narrow column. Search for the `.typ` file in the field as before. The
  *Frontmatter template file* row keeps its **Choose file…** button.
- Engine unchanged (omd2typst v0.17.1).

---

## v0.13.0 — Export as bundle, native file and folder dialogs

- **Export as bundle.** A new command (palette and right-click menu) writes a
  folder outside your vault with the note as plain Markdown and an `assets/`
  folder holding every image it uses: normal images, Mermaid diagrams and
  Excalidraw drawings rendered by Obsidian, and Bases tables (as Markdown).
  Image references are relative, so the folder converts anywhere with the
  command line tool (`omd2typst "My note.md" "My note.pdf"`, run from inside
  the folder) without Obsidian. Exporting the same note again replaces its
  folder, but only a folder that carries the `.omd2typst-bundle` marker file is
  ever replaced.
- **Choosing the bundle folder.** New settings *Bundle folder* (type a path or
  press **Choose folder…**, with a live message if the path is inside the
  vault) and *Open folder after exporting a bundle* (off by default). If no
  folder is set, the first export asks for one and remembers it. The command
  *Export as bundle to a chosen folder…* asks every time and saves nothing.
- **Choose file… button.** The *Frontmatter template file* row gets a
  **Choose file…** button that opens the system file dialog (the file must be
  inside the vault). Searching in the field still works, and the row warns when
  the file is not found. (0.13.0 also added this button to the *Add template*
  row; 0.13.1 removes it again.)
- The dialogs use an Obsidian internal that Obsidian itself uses; if a future
  version removes it you get a notice and can type the path instead.
- Engine unchanged (omd2typst v0.17.1).

---

## v0.12.2 — Tables and figure captions

- **Text below a table.** A text line directly under the last table row is now a
  paragraph, as in Obsidian. Before, it became an extra table row in the PDF.
  A table ends at the first line without a `|`.
- **Figure captions.** Captions are smaller (0.85em) and there is more space
  below a figure (2em) in the built-in template and the shipped templates
  (`purple`, `tig`, and the DUO, ro, taotek and vnet templates). Custom
  templates can add `show figure.caption: set text(size: 0.85em)` and
  `show figure: set block(below: 2em)`.
- Bundles omd2typst engine v0.17.1.

---

## v0.12.1 — Source-review fix

- Replaced `String.matchAll` in `excalidraw.ts` with a `RegExp.exec` loop. The
  store's lint runs without `@types/node` and reported three `no-unsafe-*`
  warnings for it. No functional change.

---

## v0.12.0 — Image sizes as a share of the text width

- **Behaviour change.** An image size such as `![[image.png|400]]` is in pixels
  in Obsidian, but the PDF used it as points, so images came out far too large.
  The size is now converted to the same share of the text width: size divided
  by a reference width, at most 100%. With the default 700 (Obsidian's default
  readable line length), `|400` is 57%, `|350` is 50% and `|700` is 100%.
- **New setting *Image width reference (px)*** (default 700). Enter your own
  Obsidian line width if you changed *Readable line length* or use a wider
  editor. `0` reads the sizes as points again (the old behaviour).
- Existing documents with sized images look smaller than before.
- Bundles omd2typst engine v0.17.0.

---

## v0.11.0 — Excalidraw drawings, image alt text, file-name captions

- **Excalidraw drawings are exported.** `![[Drawing.excalidraw]]` and
  `![[Drawing.excalidraw|500]]` are rendered with the Excalidraw plugin to an
  image (light theme, white background). New setting *Excalidraw drawings*:
  PNG (default, looks exactly like Obsidian), SVG (sharp when zoomed, but text
  uses a normal font because Typst cannot use Excalidraw's web font) or *Do not
  render*. Without the Excalidraw plugin, or when rendering fails, an image
  Excalidraw's "Auto-export SVG/PNG" wrote next to the drawing is used.
  Embeds of part of a drawing (`#^frame=…`) are not rendered.
- **Alt text and size in double bracket images.** `![[image.png|200|alt text]]`,
  `|alt text|200`, `|alt text` and `|100x145|alt text` now give the width and
  the alt text, in any order. The alt text becomes the figure caption. Before,
  the alt text came out as `|200|alt text` and the size was lost.
- **New setting *Use file name as caption*** (off by default): images without
  alt text get their file name as caption. Alt text always wins.
- Bundles omd2typst engine v0.16.0.

---

## v0.10.0 — LaTeX math

- **Math is written in LaTeX by default**, as Obsidian renders it, and is
  converted to Typst math: `$\log$`, `$$\frac{a}{b}$$`, `$\sqrt{x}$`, Greek
  letters, `\sum`, matrices (`pmatrix`, `bmatrix`, …) and `cases`.
- **New setting *Math syntax*** (LaTeX or Typst). Notes written in Typst math
  notation (`sum_(k=1)^n`) need *Typst*. The choice applies to every note.
- A formula that cannot be converted is passed through as typed. An unknown
  LaTeX command is not detected and fails in Typst as an unknown variable.
- Bundles omd2typst engine v0.15.0. `input/input-en-typst-math.md` is an example
  in Typst syntax.

---

## v0.9.9 — Highlight palette, super- and subscript size

- Lighter highlight colours that are closer to Obsidian's: `==🔴text==` and the
  other five dots (🟠🟡🟢🔵🟣). Plain `==text==` is unchanged.
- `<sup>` and `<sub>` no longer come out tiny in fonts like Helvetica Neue (the
  purple and tig templates): the size is now set explicitly (0.7em).
- Bundles omd2typst engine v0.14.2.

---

## v0.9.8 — Coloured highlights

- **Coloured highlights.** A coloured dot right after `==` picks the colour:
  `==🔴text==` (red), 🟠 orange, 🟡 yellow, 🟢 green, 🔵 blue, 🟣 purple. Plain
  `==text==` uses Obsidian's default highlight colour.
- The placeholder for unsupported embeds (PDFs, notes, audio/video) no longer
  says "in the CLI".
- Bundles omd2typst engine v0.14.1.

---

## v0.9.7 — Wikilinks

- **New setting *Wikilinks*.** `[[Note]]`, `[[Note|alias]]`, `[[#Heading]]` and
  block references no longer show their brackets. *Display text* (default),
  *Bold display text*, *Links* or *Keep as typed*.
- **Links mode.** `[[#Heading]]` becomes a link to that heading in the PDF, and
  links to other notes become `obsidian://` links that open the note in
  Obsidian (the vault name is stored in the PDF). Headings that do not exist
  show as plain text. Links use the template's accent colour.
- Bundles omd2typst engine v0.14.0.

---

## v0.9.6 — `reading-guide` frontmatter key

- **Reading guide page.** A new `reading-guide` frontmatter key names an H2
  section (for example `reading-guide: Leeswijzer`). The section is taken out of
  the numbered body and a template can show it as an unnumbered page of its own.
  The DUO templates (`duo-template.typ`, `duo-template-no-ribbon.typ`) show it
  right after the revision/approval page, before the table of contents.

  ```yaml
  reading-guide: Leeswijzer
  ```

  The value is the plain heading text, without `##`. A missing or empty value
  changes nothing; a name that matches no `## ` section leaves the chapter in the
  body (the plugin shows no warning for this; the CLI does).
- **Only use it with a template that supports it.** A template that does not
  render the reading guide (and the built-in template) drops the section from
  the PDF, as it does for the revision and approval sections.
- Bundles omd2typst engine v0.13.0. The `reading-guide`, `numbering-from` and
  `appendix-from` keys are now listed in the example frontmatter template.

---

## v0.9.5 — `numbering-from` frontmatter key

- **Unnumbered front matter chapters.** A new `numbering-from` frontmatter key
  names the first chapter that should be numbered. Top-level chapters before it
  (for example a reading guide) render without a number but stay in the table of
  contents; numbering restarts at 1 on the named chapter. An empty or missing
  value numbers from the beginning, as before.

  ```yaml
  numbering-from: Introduction
  ```

  The value must match a top-level chapter. A name that matches nothing changes
  nothing (the plugin shows no warning for this; the CLI does). Works with every
  template, including the built-in one, and combines with `appendix-from`.
- Bundles omd2typst engine v0.12.0. The key is also listed in the example
  frontmatter template.

---

## v0.9.4 — Declarative settings tab; release matches a clean build

- **Requires Obsidian 1.13.0 or later** (`minAppVersion` was 1.7.2). The settings
  tab now uses Obsidian's declarative settings API, so every Omd2Typst setting
  appears in Obsidian's settings search. Behaviour is unchanged: template list
  with remove, add-template row (optional name + `.typ` file search), default
  template/language, output format and location, context-menu toggles and the
  frontmatter source options.
- **Releases are built from the committed engine WASM.** The release and CI
  workflows no longer rebuild the engine with whatever Rust/wasm-pack is latest;
  they run `npm ci && npm run build` on the committed
  `src/wasm/omd2typst-pkg/`. The released `main.js` now matches a clean build
  from source, which the community-store build verification checks.
  After bumping the engine submodule, run `npm run build:wasm` locally and
  commit the result.

---

## v0.9.3 — Store-review fix for the bundled engine package

- The committed engine package (`src/wasm/omd2typst-pkg/`) now contains only the
  files the plugin imports (`omd2typst_wasm_bg.js` and `omd2typst_wasm_bg.wasm`).
  The generated `.d.ts` files carried blanket `eslint-disable` headers that the
  community-store review rejects. `npm run build:wasm` now removes them.
- No functional changes.

---

## v0.9.2 — Clean-checkout build and store-review fixes

- **The plugin now builds from a clean checkout.** The generated engine package
  (`src/wasm/omd2typst-pkg/`) was git-ignored, so `npm run build` failed on any
  fresh clone — including the community store's build check. The package is now
  committed, and was rebuilt from the omd2typst 0.11.0 engine (the previous copy
  predated it). `npm run build:wasm` regenerates it.
- **Type-safe Node access.** `typst-cli.ts` narrows `child_process`, `fs`, `os`
  and `path` to small local interfaces, so it type-checks and lints the same
  whether or not `@types/node` is available (the store's linter runs without it).
- Bases: the hidden off-screen container is created with `createDiv()` instead of
  `document.createElement`.

---

## v0.9.1 — Mermaid diagrams work again on Obsidian 1.15+

Obsidian 1.15 replaced its Mermaid renderer with **Pele**, which broke Mermaid
export in three ways. All three are fixed.

- **Diagrams are rendered again.** Pele only exposes `window.mermaid` after
  `loadMermaid()` has been called, so the plugin found no renderer and left the
  Mermaid block out of the PDF. The plugin now loads Mermaid through Obsidian's
  `loadMermaid()` (the global is still used as a fallback on older versions).
- **No more black shapes.** Pele colours diagrams with CSS variables
  (`fill="var(--_s)"`), which Typst's SVG renderer does not support, so every
  shape came out solid black. The variables are now resolved to Pele's default
  light palette — suited to print — and rounded corners are kept.
- **No more question marks in labels.** Emoji in node or edge labels were drawn
  as `?` boxes. They are now removed from diagram text (Typst has no colour-emoji
  font), as already happened with the older label format.

Internal, for the community-store review:

- `typst-cli.ts` uses typed `import`s for `fs`, `path`, `os` and
  `child_process` instead of `require()`, runs Typst with `execFileSync` and an
  argument array (no shell string), and no longer reads environment variables
  to find the cargo `typst` binary.
- Settings suggestion lists use `createDiv`.
- Development dependencies updated: `obsidian` 1.14.4 typings and
  `eslint-plugin-obsidianmd` 0.5.1.

---

## v0.9.0 — Appendix headings, page breaks, tables & embed safety

Built on the omd2typst 0.11.0 engine.

- **Appendix headings.** Add `appendix-from: "<chapter title>"` to a note's
  frontmatter to turn that chapter — and every chapter after it — into
  appendices, numbered `Appendix A - <title>` with letter sub-numbering
  (`A.1`, `A.1.1`). The prefix is localized: Bijlage (nl), Appendix (en),
  Anhang (de), Apéndice (es), Appendice (fr). Supported by the bundled tig and
  purple templates; other templates simply ignore the key.
- **Each chapter starts on a new page** in the tig and purple templates
  (appendices included).
- **Table layout.** Cells are left-aligned (no longer stretched/justified) and
  hyphenate, so a long word wraps within its column instead of overflowing into
  the neighbouring one.
- **Non-image embeds no longer break PDF export.** A `.pdf`, audio/video, or
  note-transclusion embed now renders a visible "not supported" placeholder
  instead of failing Typst compilation.

Internal: removed the dormant pdf-wasm PDF-compiler tooling (PDF export uses a
locally-installed Typst binary) and bumped the engine submodule to
omd2typst 0.11.0.

---

## v0.8.38 — Image links resolve regardless of Obsidian's link format

Exporting a note whose images used Obsidian's **"Absolute path in vault"**
link format (Settings → Files & links → New link format) failed with
`error: file not found`. The image path — a vault-root path with no leading
slash, e.g. `04-Personal/…/_assets/laptop.png` — was resolved relative to the
note's folder and ended up doubled (`…/input/04-Personal/…/input/_assets/…`).

The plugin now resolves **every** image reference the way Obsidian's own
preview does and rewrites it to a vault-root-absolute path before export:

- Markdown images (`![](…)`) and wikilink embeds (`![[…]]`) are both handled.
- All of Obsidian's link formats work — relative, shortest path (bare
  filename), and absolute-in-vault — as do `./`, `../`, and paths with spaces.
- External URLs and already-absolute paths are left untouched.
- Image syntax inside code blocks and inline code is **not** rewritten, so
  documentation that shows `![](…)` as an example is preserved.

Only references that resolve to a real image file in the vault are rewritten;
anything else is left exactly as written.

See ADR 0013. This closes the regression documented in ADR 0012.

---

## v0.8.37 — Mermaid: honour `<br>` and auto-wrap long labels

Mermaid labels that Obsidian wrapped across multiple lines used to render as
a single overflowing line in the PDF, because `<foreignObject>` HTML labels
wrap via CSS in the browser but SVG `<text>` does not auto-wrap.

The plugin now emits one `<tspan>` per line inside the SVG `<text>`:

- Explicit `<br>` in the mermaid source becomes a hard line break.
- A single long line is auto-wrapped at word boundaries to fit the
  foreignObject's width. The wrap point matches Obsidian's preview to about
  ±1 word (character-width estimation is approximate).
- The `<text>` output for single-line labels is unchanged.

Common HTML entities (`&lt;`, `&gt;`, `&quot;`, `&amp;`, `&#39;`, `&apos;`)
are decoded before measuring wrap width so labels like `A &amp; B` count as
5 visible characters, not 10.

Emojis in mermaid labels remain stripped (unchanged from v0.8.36) —
FontAwesome icons in mermaid labels are still unsupported.

---

## v0.8.36 — Folder-relative image paths in PDF; strip emojis from mermaid labels

### Bug fix — folder-relative image paths now resolve in PDF export

Notes with folder-relative image references — e.g. `![](./_assets/foo.svg)`,
which is what Obsidian's editor produces for images stored next to a note —
no longer fail with `file not found` during PDF export.

The plugin used to write the transient `.typ` at the vault root before
invoking `typst compile`. Typst resolves relative image paths from the `.typ`
file's directory, so `./_assets/foo.svg` looked in `<vault>/_assets/foo.svg`
instead of alongside the note. The temp `.typ` is now written inside the
note's own folder, so folder-relative paths resolve as Obsidian previews them.

Vault-root-absolute paths (`/Attachments/foo.svg`) continue to work via
`--root <vault>`. Unprefixed vault-root paths (`Attachments/foo.svg` meaning
`<vault>/Attachments/foo.svg`) — which Obsidian's editor does not generate —
need a leading `/` after this change.

### Change — emoji codepoints in mermaid labels are stripped

resvg (the SVG renderer Typst uses to embed mermaid diagrams) can't render
color-emoji glyphs cleanly: labels either show as tofu (`□`) or overflow the
node boundary that mermaid sized via browser-side measurement. The plugin
now removes emoji codepoints (Extended Pictographic, emoji modifiers, ZWJ,
VS16) from mermaid labels before embedding, keeping the surrounding text.
Example: `Foo 📊 Bar` → `Foo Bar`. Documented in the README.

---

## v0.8.35 — Add bottom spacing to figures (built-in template + omd2typst v0.10.7)

Two consecutive figures (e.g. mermaid diagrams or images) and the text
between them used to sit very tight against each other in the PDF. The
built-in template (bundled in the omd2typst WASM) and both shipped templates
(`purple-template`, `tig-template`) now declare:

```typst
#show figure: set block(below: 1.5em)
```

This adds 1.5em of vertical space *below* each figure block. The top of the
block is unchanged.

Built on omd2typst v0.10.7 (core/wasm 0.5.4).

Users with custom templates can add the same `show` rule to their templates
if they want matching behaviour.

---

## v0.8.34 — Mermaid: post-process flowchart SVG to remove foreignObject

The flowchart node labels were still missing in v0.8.33 because mermaid v11's
`flowchart-v2` renderer (used in Obsidian) emits node labels as `<foreignObject>`
containing HTML *regardless of* the `htmlLabels: false` config — that setting
only affects edges. resvg (Typst's SVG renderer) ignores `<foreignObject>`, so
even with v0.8.33 the boxes appeared empty.

This release adds a post-processing pass on the SVG returned by `mermaid.render`:
each `<foreignObject>` is replaced with an SVG `<text>` element positioned at
the centre of the foreignObject's box. The inner HTML is stripped to plain text
(so `<i class="fa fa-car"></i> Car` becomes `Car`). Empty foreignObjects (e.g.
placeholder edge labels) are removed entirely.

Verified end-to-end: `typst compile` now emits no `image contains foreign object`
warning, and all flowchart node text — `Christmas`, `Go shopping`, `Let me think`,
`Laptop`, `iPhone`, `Car` — appears in the rendered PDF.

---

## v0.8.33 — Mermaid: render flowchart labels as SVG text (Typst-compatible)

Flowchart text labels were missing from exported PDFs because mermaid renders
them as `<foreignObject>` containing HTML — a format Typst's SVG renderer
(`resvg`) cannot draw. Mermaid is now initialised with
`flowchart: { htmlLabels: false }` so flowchart labels become plain SVG
`<text>` elements, which Typst handles correctly.

Side effect: Obsidian's editor preview also uses this setting until the app is
restarted, so flowchart labels in the preview will use SVG text (slightly
different wrapping behaviour) for the remainder of the session.

Diagram types that already used SVG text (`gitGraph`, `mindmap`, `sequenceDiagram`,
etc.) are unaffected.

---

## v0.8.32 — Mermaid: use diagram title as Typst figure caption

Mermaid diagrams that declare a `title:` in their frontmatter now get a proper
Typst figure caption underneath, which also appears in any auto-generated list
of figures:

```
\`\`\`mermaid
---
title: GitGraph example
---
gitGraph
  commit
\`\`\`
```

The title is extracted from the mermaid source, stripped from the source sent
to `mermaid.render` (so it doesn't ALSO get baked into the SVG itself), and
used as the markdown image's alt text — which `omd2typst` already maps to the
Typst figure caption. Other frontmatter keys (e.g. `config:`) are preserved.

Diagrams without a title behave as before — empty caption.

---

## v0.8.31 — Bases: hide all-empty columns; treat NullValue as empty

Matches Obsidian's UI behaviour of auto-hiding columns whose cells are null
across every row. Previously the PDF showed e.g. a `published` column full of
the literal text "null" even though Obsidian didn't display it.

Implementation: each cell is checked via `Value.isTruthy()` — a missing
property (`getValue` returns null) and a `NullValue` (which would
`toString()` to "null") are both treated as empty. Columns whose every cell
ends up empty are dropped before the Markdown table is emitted.

---

## v0.8.30 — Fix Obsidian review: drop unsupported-API suppressions

`obsidianmd/no-unsupported-api` can't be suppressed with `eslint-disable`
(the review bot rejects it). The bases module now declares local structural
interfaces (`BasesViewConfigLike`, `BasesEntryLike`, …) instead of importing
Obsidian's typed Bases classes, so the linter no longer flags 1.10-era API
calls. Functionally identical to v0.8.29.

`minAppVersion` stays at 1.7.2: users on older Obsidian can still install for
mermaid / template-picker features; base embeds render the placeholder line
on those versions since the bases engine isn't present.

---

## v0.8.29 — Bases: rewritten on top of Obsidian's own query engine

The internal regex evaluator (v0.8.20–v0.8.28) is gone. It only supported a
handful of filter operators and quietly produced wrong results on anything else
(a 323-page PDF on one test base because broad filters silently matched every
file in the vault).

The new implementation drives Obsidian's own bases engine: each `![[file.base]]`
embed is loaded through Obsidian's embed registry, off-screen, in a temporary
`Component`. Once the query result is ready we read it via the public types
(`BasesViewConfig.getOrder` / `getDisplayName`, `BasesEntry.getValue`,
`Value.toString`) and emit a Markdown pipe table. The full filter language
(string, list, math, date, file, link, tag, formulas — about 50 operators) is
supported automatically because Obsidian is doing the evaluation.

If Obsidian's engine isn't available (older versions, or the query fails to
complete in 5 s), a placeholder line is emitted instead of guessed data:
`*[Base view 'name.base' not rendered]*`.

Requires the Obsidian Bases plugin to be enabled (built into Obsidian 1.10+).

---

## v0.8.28 — Bases: support endsWith / contains; safer unsupported handling; default sort

Three fixes to the internal bases evaluator:

- **`file.name.endsWith()`, `file.name.contains()`, `file.path.endsWith()`, `file.path.contains()`** are now recognised. This is what unblocked the
  common `!file.name.endsWith(".pdf")` exclusion filter.
- **Unsupported filter expressions no longer silently exclude every file when negated.** Before, `!unknown.func()` evaluated to `false` and the
  entire base returned zero results. Unsupported expressions now match-all
  whether negated or not.
- **Tables without an explicit `sort` now default to ASC by their first column**, matching Obsidian's own table-view default. Previously rows
  appeared in vault scan order (often descending mtime).

Also: `file.name.startsWith` now uses the full filename (including extension),
matching Obsidian's convention. No effect on existing prefix matches.

---

## v0.8.27 — Fix mermaid rendering for notes with spaces in the title

Mermaid diagrams now render correctly in PDFs even when the note title (or its
folder path) contains a space. The generated image reference is now wrapped in
angle brackets — `![](<path with space.svg>)` — which is the standard CommonMark
way to encode special characters in URLs.

Before this fix, the literal markdown text `![](path with space.svg)` was
passed straight to the PDF because the WASM markdown parser doesn't accept
spaces in unbracketed URLs.

---

## v0.8.26 — Remove accidentally committed scratch files

The v0.8.25 commit accidentally included `app.js` and `mermaid.min.js` extracted
from Obsidian's ASAR during investigation. These are removed and ignored via
`.gitignore`. No functional change.

---

## v0.8.25 — Remove unused styles.css

The `styles.css` file added in v0.8.23 for Path A is no longer needed (Path A
is disabled). The file is removed to silence Obsidian's 404 in the console
when the plugin loads.

---

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
