# Design: Mermaid Diagram Support

**Date:** 2026-06-11
**Status:** Approved

## Problem

Mermaid code blocks (` ```mermaid `) pass through the omd2typst pipeline as raw code listings. Obsidian renders them as diagrams in its preview, but the exported PDF or `.typ` file shows the diagram source instead of the rendered diagram.

## Background

Obsidian bundles `mermaid.min.js` in its ASAR (`/lib/mermaid.min.js`) and uses it to render mermaid blocks in its HTML preview. Its PDF export works by printing the already-rendered HTML view via Chromium's `webContents.printToPDF()` — so mermaid diagrams appear in Obsidian-generated PDFs for free.

omd2typst goes a different route (Markdown → Typst → PDF via the typst CLI) and never touches the HTML renderer, so mermaid conversion must be handled explicitly.

## Approach

**Primary:** Use `window.mermaid` — Obsidian's own bundled mermaid library — at runtime. Zero bundle size impact.

**Declared fallback:** If `window.mermaid` proves unreliable across Obsidian versions, add `mermaid@^11` as an npm dependency and replace the `(window as any).mermaid` call with the bundled import. The rest of the design is identical.

## Pipeline

```
Markdown
  → renderMermaidBlocks()   [new, plugin only]
  → modified Markdown (mermaid blocks → image refs)
  → renderToTypst (WASM)    [unchanged]
  → Typst source
  → typst CLI               [unchanged]
  → PDF
```

No changes to the omd2typst Rust crate or WASM bundle.

## Scope

Plugin-only change. Two files modified, one created.

## Files

| Action | Path | Purpose |
|--------|------|---------|
| Create | `src/mermaid.ts` | `renderMermaidBlocks()` — detect, render, replace, return cleanup |
| Modify | `src/exporter.ts` | Call `renderMermaidBlocks()` before `renderToTypst`; cleanup in `finally` |
| Create | `tests/mermaid.test.ts` | Unit tests for detection and replacement logic |

## Design

### `src/mermaid.ts`

Single exported function:

```typescript
export async function renderMermaidBlocks(
  markdown: string,
  app: App,
  noteFile: TFile,
): Promise<{ markdown: string; cleanup: () => Promise<void> }>
```

**Detection:** Regex finds all fenced ` ```mermaid ` blocks. Each gets a temp SVG filename:
`{note-basename}-mermaid-{index}.svg` in the same vault folder as the note.

**Rendering:**

```typescript
const mermaid = (window as any).mermaid as MermaidApi | undefined;
if (!mermaid) { /* fallback — see below */ }
mermaid.initialize({ startOnLoad: false }); // called once per renderMermaidBlocks() invocation, not per diagram
const { svg } = await mermaid.render(`omd2typst-mermaid-${index}`, diagramSource);
```

**Replacement:** Each mermaid block replaced with `![](vault-relative-svg-path)` — handled by the existing image pipeline unchanged.

**Cleanup:** Returns `cleanup()` which deletes all written SVG files via `app.vault.adapter.remove()`. Delete errors are swallowed — a leftover SVG is harmless.

### `src/exporter.ts`

Wrap the existing export body:

```typescript
export async function exportNote(
  file: TFile,
  format: OutputFormat,
  template: TemplateEntry | null,
  settings: Omd2TypstSettings,
  app: App,
): Promise<void> {
  const rawMarkdown = await app.vault.read(file);
  const { markdown, cleanup } = await renderMermaidBlocks(rawMarkdown, app, file);
  try {
    // existing pipeline — uses `markdown` instead of `rawMarkdown`
  } finally {
    await cleanup();
  }
}
```

No other changes to `exporter.ts`.

### Temp file handling

SVG files are written to the **same vault folder as the note**, named `{note-basename}-mermaid-{index}.svg`. This ensures the Typst CLI can resolve them — it runs with the vault root as its working directory, and all image paths in the generated Typst source are already vault-relative.

Files are written via `app.vault.adapter.write()` and deleted in the `finally` cleanup. They exist for milliseconds during export and are never user-visible under normal operation.

### Fallback behaviour

**`window.mermaid` not available:**
Return original Markdown unchanged. Show one Notice:
> *"Mermaid diagrams not rendered — Obsidian's mermaid library was not found. Restart Obsidian and try again."*
Export completes with diagram source visible as a code block.

**`render()` throws** (e.g. invalid diagram syntax):
Skip that diagram, leave its block as a code listing. Show one Notice per failure:
> *"Mermaid diagram {n} could not be rendered: {error message}."*
Other diagrams in the same note still render.

## Testing

Unit tests in `tests/mermaid.test.ts` — `window.mermaid` and vault adapter mocked:

| Test | What it checks |
|------|----------------|
| No mermaid blocks | Returns markdown unchanged, cleanup is no-op |
| Single block detected | Correct SVG filename generated, block replaced with `![]()` ref |
| Multiple blocks | Each gets its own indexed filename |
| Fallback when `window.mermaid` absent | Returns original markdown, no SVG writes, Notice shown |
| `render()` throws on one block | That block left as code listing, others replaced, Notice shown |

Rendering quality (SVG correctness) is not unit-tested — that is the mermaid library's responsibility.

## Out of scope

- Mermaid theme control (light/dark) — uses mermaid defaults
- Mermaid config per diagram (e.g. `%%{init: ...}%%` directives) — passed through as-is to `mermaid.render()`; if the library honours them, they work; if not, they don't
- Any changes to the omd2typst Rust crate or WASM bundle
