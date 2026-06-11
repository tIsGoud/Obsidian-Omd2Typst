# Design: Obsidian Bases Support

**Date:** 2026-06-12
**Status:** Approved

## Problem

Notes that embed an Obsidian Bases view (`![[file.base]]` or `![[file.base#view-name]]`) currently produce a broken `image("file.base")` reference in the Typst output, causing a compile error. The exported PDF should instead contain the actual query results rendered as a table.

## Approach

Use `app.metadataCache` — Obsidian's in-memory frontmatter cache for all vault notes — as the data source. Parse the `.base` YAML, evaluate the filter tree against the cache, collect results per the view's column definitions, and replace each embed with a standard Markdown table before the Markdown reaches the WASM.

No undocumented plugin APIs. One clean path, no fallbacks. The filter evaluator can be upgraded later if the Bases plugin exposes a public API.

## Pipeline

```
Markdown
  → renderBaseEmbeds()    [new, plugin only]
  → renderMermaidBlocks() [existing]
  → renderToTypst (WASM)  [unchanged]
  → Typst CLI             [unchanged]
  → PDF
```

Bases runs before mermaid. No temp files are written — the output is inline Markdown text.

## Scope

Plugin-only change. No changes to the omd2typst Rust crate or WASM bundle.

## Files

| Action | Path | Purpose |
|--------|------|---------|
| Create | `src/bases.ts` | `renderBaseEmbeds()` and all supporting functions |
| Modify | `src/exporter.ts` | Call `renderBaseEmbeds` before `renderMermaidBlocks` |
| Create | `tests/bases.test.ts` | Unit tests for detection, filtering, table building |

## Design

### `src/bases.ts`

#### Exported function

```typescript
export async function renderBaseEmbeds(
  markdown: string,
  app: App,
  noteFile: TFile,
): Promise<string>
```

Returns the markdown with all `![[*.base]]` embeds replaced by Markdown tables (or removed on error).

#### Embed detection

Regex: `/!\[\[([^\]#|]+\.base)(?:#([^\]|]+))?\]\]/g`

- Group 1: the base file path or filename (e.g. `Speaker dinner locations.base`)
- Group 2 (optional): the view name fragment (e.g. `gepubliceerd`)

File resolution uses `app.metadataCache.getFirstLinkpathDest(baseName, noteFile.path)` — the same wikilink resolution Obsidian uses internally.

#### Internal types

```typescript
interface BaseFilterNode {
  and?: BaseFilterNode[];
  or?: BaseFilterNode[];
}
type BaseFilter = BaseFilterNode | string;

interface BaseView {
  type: string;
  name: string;
  filters?: BaseFilter;
  order?: string[];
  sort?: Array<{ property: string; direction: 'ASC' | 'DESC' }>;
  columnSize?: Record<string, number>;
}

interface BaseDefinition {
  filters?: BaseFilter;
  views: BaseView[];
  properties?: Record<string, { displayName?: string }>;
}
```

#### View selection

`resolveView(base: BaseDefinition, viewName?: string): BaseView`

- If `viewName` is provided and a view with that name exists → use it
- If `viewName` is provided but not found → use first view, show Notice: *"View 'name' not found in filename.base — using first view"*
- If no `viewName` → use first view

#### Filter evaluation

`evaluateFilter(filter: BaseFilter, file: TFile, cache: CachedMetadata): boolean`

Filter nodes:
- `{ and: [...] }` — all children must match
- `{ or: [...] }` — at least one child must match
- `string` — a leaf expression; if prefixed with `!`, negate the inner expression

Leaf expression patterns supported:

| Pattern | Example |
|---------|---------|
| `file.name.startsWith("s")` | `file.name.startsWith("SAP-ADR-")` |
| `file.ext == "s"` / `!= "s"` | `file.ext != "png"` |
| `file.path.startsWith("s")` | `!file.path.startsWith("10-System")` |
| `file.tags.contains("s")` | `file.tags.contains("excalidraw")` |
| `file.tags.containsAny("s")` | `file.tags.containsAny("devnetnoord/speaker-dinner-location")` |
| `property == true\|false` | `gepubliceerd == true` |
| `property != true\|false` | `gepubliceerd != true` |
| `property == "string"` | `note["progress-status"] == "🚧"` |
| `property != "string"` | any string comparison |
| `property == link("name")` | `categories == link("Presentations")` |

`link("name")` matches if the frontmatter value is a string containing `[[name]]` or `[[name|alias]]`, or is an array containing such a string.

Unsupported expressions are skipped (treated as matching all files) and collected for a single Notice shown after all embeds are processed: *"Unsupported filter expressions skipped in filename.base: expr1, expr2"*

#### Vault scan

```typescript
async function queryView(
  base: BaseDefinition,
  view: BaseView,
  app: App,
): Promise<Record<string, unknown>[]>
```

1. `app.vault.getMarkdownFiles()` — all `.md` files
2. For each file, `app.metadataCache.getFileCache(file)` — in-memory, no I/O
3. Apply top-level `base.filters` first, then `view.filters`
4. For passing files, extract columns from `view.order` (see Cell values below)
5. Apply `view.sort` if present

All data comes from the in-memory metadata cache — no file reads.

#### Cell values

For each column in `view.order`:

| Column | Value |
|--------|-------|
| `file.name` | `file.basename` (no extension) |
| `file.path` | Vault-relative path |
| `file.ext` | File extension without dot |
| `file.tags` | Tags joined with `, ` (tag `#` prefix stripped) |
| frontmatter key | String-formatted value; arrays joined with `, `; Obsidian links (`[[Name]]` or `[[Name\|alias]]`) → display text only; missing/null → empty string |

#### Column headers

`columnHeader(col: string, base: BaseDefinition): string`

- If `base.properties?.[col]?.displayName` is defined → use it
- Otherwise strip `file.` prefix → `file.name` → `name`, `year` → `year`

#### Table output

Standard Markdown pipe table:

```
| name | year |
| ---- | ---- |
| venue-amsterdam | 2024 |
```

Zero rows → `*No results.*` (single italic line, no table)

### `src/exporter.ts`

Add import and call before `renderMermaidBlocks`:

```typescript
import { renderBaseEmbeds } from './bases';

// in exportNote, after reading rawMarkdown:
const markdownAfterBases = await renderBaseEmbeds(rawMarkdown, app, file);
const { markdown, cleanup } = await renderMermaidBlocks(markdownAfterBases, app, file);
```

## Fallback behaviour

| Situation | Behaviour |
|-----------|-----------|
| `.base` file not found | Remove embed, Notice: *"Base not found: filename.base"* |
| View name in `#fragment` not found | Use first view, Notice: *"View 'name' not found in filename.base — using first view"* |
| Unsupported filter expression | Skip expression (match all), one Notice per base listing all skipped expressions |
| Zero rows | Replace with `*No results.*`, no Notice |
| YAML parse error | Remove embed, Notice: *"Could not parse filename.base"* |

## Testing

Unit tests in `tests/bases.test.ts`. All tests mock `app.metadataCache` and `app.vault` — no vault file I/O.

| Test | What it checks |
|------|----------------|
| No base embeds | Returns markdown unchanged |
| Single embed replaced | Correct table in output, embed removed |
| `#view-name` fragment | Named view selected |
| `#view-name` not found | Falls back to first view, Notice shown |
| Base file not found | Embed removed, Notice shown |
| `file.ext == "png"` filter | Only matching files included |
| `file.name.startsWith("SAP-ADR-")` filter | Prefix match correct |
| `file.tags.containsAny("tag")` filter | Tag match correct |
| `property == true` filter | Boolean frontmatter match |
| `property == link("Name")` filter | `[[Name]]` frontmatter match |
| `!expr` negation | Inverts result correctly |
| `and` / `or` branch nodes | Logical operators correct |
| Top-level + view-level filters combined | Both applied (AND semantics) |
| Zero results | `*No results.*` in output |
| `displayName` override | Header uses display name |
| `sort` applied | Rows in correct order |

## Out of scope

- Bases plugin internal API — may be explored in a future update
- `cards`, `calendar`, `gallery` view types — only `table` view is rendered; other view types produce a Notice: *"View type 'cards' in filename.base is not supported — only table views are exported"*
- Incremental/cached query results across exports
- Any changes to the omd2typst Rust crate or WASM bundle
