# Design: Multi-line summary support

**Date:** 2026-06-09
**Status:** Approved

## Problem

The `summary` frontmatter field on the PDF cover page does not support multi-line text. Writing a YAML literal block scalar (`|`) produces a literal `|` character as the value instead of the multi-line body, because the parser does not handle block scalars.

## User-facing syntax

```yaml
---
title: My Document
summary: |
  First line of the summary.
  Second line of the summary.
  Third line of the summary.
---
```

Expected PDF output: three separate lines in the summary box on the cover page.

## Root causes

Two bugs in the `omd2typst` Rust crate:

**Bug 1 — Parser** (`crates/core/src/parser.rs`):
`parse_yaml_frontmatter` does not handle the `|` block scalar indicator. When it sees `summary: |`, it calls `yaml_scalar_to_fm_value("|")` and stores the pipe character as the value. The indented body lines are never collected.

**Bug 2 — Renderer** (`crates/core/src/renderer.rs`):
`is_plain_inlines` returns `true` for `HardBreak`. This routes any value containing line breaks through `inlines_to_plain_text`, which converts `HardBreak → ' '` (a space), losing all line breaks. The fix is to exclude `HardBreak` from "plain" so multi-line values take the content block path instead.

## Scope

Changes are confined to the `omd2typst` Rust crate. The plugin requires a follow-up build:
1. Fix and release a new `omd2typst` version
2. Update the plugin's `libs/omd2typst` submodule to the new commit
3. Run `npm run build:wasm` to rebuild the WASM bundle
4. Run `npm run build` to embed the new WASM in `main.js`
5. Release a new plugin version

## Design

### Parser change (`crates/core/src/parser.rs`)

In `parse_yaml_frontmatter`, add a branch to handle `rest.trim() == "|"`:

1. Peek at the first non-empty following line to determine the indent depth (number of leading spaces)
2. Collect subsequent lines while they are empty or start with that indent prefix; strip the prefix from each
3. Join collected lines with `\n` and `trim_end()` (YAML default "clip" chomping — trailing newlines stripped)
4. Feed the result to `yaml_scalar_to_fm_value` as normal

Only `|` (literal block) is in scope. The folded block `>` is excluded (YAGNI — its behaviour of collapsing newlines to spaces can already be achieved by writing the value inline).

### Renderer change (`crates/core/src/renderer.rs`)

Remove `HardBreak` from `is_plain_inlines`:

```rust
// Before
fn is_plain_inlines(inlines: &[Inline]) -> bool {
    inlines.iter().all(|i| matches!(i, Inline::Text(_) | Inline::SoftBreak | Inline::HardBreak))
}

// After
fn is_plain_inlines(inlines: &[Inline]) -> bool {
    inlines.iter().all(|i| matches!(i, Inline::Text(_) | Inline::SoftBreak))
}
```

Any frontmatter value that contains `HardBreak` now takes the content block path in `render_fm_value`, producing:

```typst
#let summary = [First line\ 
Second line\ 
Third line]
```

`render_inlines` already emits `\\\n` for `HardBreak` — the correct Typst line-break syntax inside a content block. No change needed there.

### Template compatibility

All three places that render summary use `#if summary != "" [#summary]`. When `summary` is a Typst content block, `content != ""` evaluates to `true` (different types are never equal in Typst). No changes needed in `renderer.rs` (built-in template), `purple-template.typ`, or `tig-template.typ`.

## Testing

**Unit tests** (new, in `crates/core/src/`):

| Test | Input | Expected output |
|------|-------|----------------|
| Parser: basic block scalar | `summary: |` + two indented lines | `FrontmatterValue::Inlines` with `[Text, HardBreak, Text]` |
| Parser: trailing blank lines | block body with trailing empty lines | trailing whitespace stripped |
| Parser: next key stops collection | block followed by another `key: value` | body stops at un-indented line |

**Integration test** (extend existing round-trip tests):

Input: markdown with `summary: |` frontmatter → rendered Typst output contains `[First line\ \nSecond line]` as the `summary` variable.

## Out of scope

- YAML folded block scalar `>` (newlines → spaces) — not requested
- YAML chomping indicators `|-` and `|+` — not requested; default clip behaviour is sufficient
- Mermaid, Excalidraw, Bases, Dataview — separate features
