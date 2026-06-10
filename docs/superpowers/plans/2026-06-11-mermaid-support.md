# Mermaid Diagram Support — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Render Mermaid code blocks to SVG images during export so diagrams appear in the PDF instead of raw source.

**Architecture:** A new `renderMermaidBlocks()` function in `src/mermaid.ts` is called from `src/exporter.ts` before the WASM pipeline. It scans for ` ```mermaid ` blocks, renders each to SVG using `window.mermaid` (Obsidian's own bundled library), writes temp SVGs alongside the note, and replaces each block with a standard `![]()` image reference. Temp files are deleted in a `finally` block after export.

**Tech Stack:** TypeScript, Obsidian Plugin API (`App`, `TFile`), `window.mermaid` (Obsidian's bundled mermaid library), Jest

---

## Files

| Action | Path | Purpose |
|--------|------|---------|
| Create | `src/mermaid.ts` | `renderMermaidBlocks()` — detect, render, replace, cleanup |
| Modify | `src/exporter.ts` | Call `renderMermaidBlocks` before WASM; cleanup in `finally` |
| Create | `tests/mermaid.test.ts` | Unit tests for all detection and replacement logic |

---

## Task 1: Create `src/mermaid.ts` with TDD

**Files:**
- Create: `src/mermaid.ts`
- Create: `tests/mermaid.test.ts`

- [ ] **Step 1: Create `tests/mermaid.test.ts` with all five failing tests**

  The Jest environment is `node` — `window` doesn't exist. Tests set `(global as any).window = {}` in `beforeEach` and tear it down in `afterEach`.

  ```typescript
  import { renderMermaidBlocks } from '../src/mermaid';
  import type { TFile } from 'obsidian';

  function makeFile(path: string): TFile {
    const parts = path.split('/');
    const name = parts[parts.length - 1];
    const basename = name.replace(/\.[^.]+$/, '');
    const parent = parts.length > 1 ? { path: parts.slice(0, -1).join('/') } : null;
    return { path, name, basename, extension: 'md', parent } as unknown as TFile;
  }

  function makeApp() {
    return {
      vault: {
        adapter: {
          write: jest.fn().mockResolvedValue(undefined),
          remove: jest.fn().mockResolvedValue(undefined),
        },
      },
    };
  }

  function makeMermaid(renderImpl?: jest.Mock) {
    return {
      initialize: jest.fn(),
      render: renderImpl ?? jest.fn().mockResolvedValue({ svg: '<svg>diagram</svg>' }),
    };
  }

  describe('renderMermaidBlocks', () => {
    beforeEach(() => { (global as any).window = {}; });
    afterEach(() => { delete (global as any).window; jest.clearAllMocks(); });

    it('returns markdown unchanged when no mermaid blocks present', async () => {
      const md = '# Hello\n\nSome text\n\n```typescript\nconst x = 1;\n```\n';
      const app = makeApp();
      const file = makeFile('notes/doc.md');

      const { markdown, cleanup } = await renderMermaidBlocks(md, app as any, file);

      expect(markdown).toBe(md);
      expect(app.vault.adapter.write).not.toHaveBeenCalled();
      await cleanup();
      expect(app.vault.adapter.remove).not.toHaveBeenCalled();
    });

    it('replaces a single mermaid block with a vault-relative image reference', async () => {
      const md = '# Doc\n\n```mermaid\ngraph TD\n  A --> B\n```\n\nEnd\n';
      const app = makeApp();
      const file = makeFile('notes/doc.md');
      (global as any).window.mermaid = makeMermaid();

      const { markdown, cleanup } = await renderMermaidBlocks(md, app as any, file);

      expect(markdown).toContain('![](notes/doc-mermaid-0.svg)');
      expect(markdown).not.toContain('```mermaid');
      expect(app.vault.adapter.write).toHaveBeenCalledWith(
        'notes/doc-mermaid-0.svg',
        '<svg>diagram</svg>',
      );
      await cleanup();
      expect(app.vault.adapter.remove).toHaveBeenCalledWith('notes/doc-mermaid-0.svg');
    });

    it('assigns indexed filenames to multiple mermaid blocks', async () => {
      const md = '```mermaid\ngraph TD\n  A-->B\n```\n\nText\n\n```mermaid\nsequenceDiagram\n  A->>B: hi\n```\n';
      const app = makeApp();
      const file = makeFile('notes/doc.md');
      (global as any).window.mermaid = makeMermaid();

      const { markdown } = await renderMermaidBlocks(md, app as any, file);

      expect(markdown).toContain('![](notes/doc-mermaid-0.svg)');
      expect(markdown).toContain('![](notes/doc-mermaid-1.svg)');
      expect(app.vault.adapter.write).toHaveBeenCalledTimes(2);
    });

    it('returns original markdown and shows Notice when window.mermaid is absent', async () => {
      const md = '```mermaid\ngraph TD\n  A-->B\n```\n';
      const app = makeApp();
      const file = makeFile('notes/doc.md');
      // window exists but mermaid is not on it
      const noticeSpy = jest.spyOn(require('obsidian'), 'Notice');

      const { markdown } = await renderMermaidBlocks(md, app as any, file);

      expect(markdown).toBe(md);
      expect(app.vault.adapter.write).not.toHaveBeenCalled();
      expect(noticeSpy).toHaveBeenCalledWith(
        expect.stringContaining('mermaid library was not found'),
      );
      noticeSpy.mockRestore();
    });

    it('leaves a failing block as code listing and shows Notice; other blocks still render', async () => {
      const md = '```mermaid\nbad diagram\n```\n\nText\n\n```mermaid\ngraph TD\n  A-->B\n```\n';
      const app = makeApp();
      const file = makeFile('notes/doc.md');
      (global as any).window.mermaid = makeMermaid(
        jest.fn()
          .mockRejectedValueOnce(new Error('parse error'))
          .mockResolvedValueOnce({ svg: '<svg>ok</svg>' }),
      );
      const noticeSpy = jest.spyOn(require('obsidian'), 'Notice');

      const { markdown } = await renderMermaidBlocks(md, app as any, file);

      expect(markdown).toContain('```mermaid\nbad diagram\n```');
      expect(markdown).toContain('![](notes/doc-mermaid-1.svg)');
      expect(noticeSpy).toHaveBeenCalledWith(
        expect.stringContaining('diagram 1 could not be rendered'),
      );
      noticeSpy.mockRestore();
    });
  });
  ```

- [ ] **Step 2: Run tests to confirm all five fail**

  ```bash
  cd /Users/albert/Projects/Omd2Typst@Github/obsidian-omd2typst && npm test -- --testPathPattern=mermaid 2>&1 | tail -15
  ```

  Expected: 5 tests fail with `Cannot find module '../src/mermaid'`.

- [ ] **Step 3: Create `src/mermaid.ts`**

  ```typescript
  import { App, Notice, TFile } from 'obsidian';

  interface MermaidApi {
    initialize: (config: Record<string, unknown>) => void;
    render: (id: string, definition: string) => Promise<{ svg: string }>;
  }

  function getMermaid(): MermaidApi | undefined {
    if (typeof window === 'undefined') return undefined;
    return (window as any).mermaid as MermaidApi | undefined;
  }

  export async function renderMermaidBlocks(
    markdown: string,
    app: App,
    noteFile: TFile,
  ): Promise<{ markdown: string; cleanup: () => Promise<void> }> {
    const noop = async () => {};

    // Collect all fenced mermaid blocks with their positions
    const re = /^```mermaid\n([\s\S]*?)^```/gm;
    const blocks: Array<{ start: number; end: number; source: string }> = [];
    let match: RegExpExecArray | null;
    while ((match = re.exec(markdown)) !== null) {
      blocks.push({ start: match.index, end: match.index + match[0].length, source: match[1] });
    }

    if (blocks.length === 0) {
      return { markdown, cleanup: noop };
    }

    const mermaid = getMermaid();
    if (!mermaid) {
      new Notice(
        "Mermaid diagrams not rendered — Obsidian's mermaid library was not found. Restart Obsidian and try again.",
      );
      return { markdown, cleanup: noop };
    }

    mermaid.initialize({ startOnLoad: false });

    const dir = noteFile.parent ? noteFile.parent.path + '/' : '';
    const writtenPaths: string[] = [];
    // Default: keep original block text (used when render fails)
    const replacements: string[] = blocks.map(b => markdown.slice(b.start, b.end));

    for (let i = 0; i < blocks.length; i++) {
      const svgPath = `${dir}${noteFile.basename}-mermaid-${i}.svg`;
      try {
        const { svg } = await mermaid.render(`omd2typst-mermaid-${i}`, blocks[i].source);
        await app.vault.adapter.write(svgPath, svg);
        writtenPaths.push(svgPath);
        replacements[i] = `![](${svgPath})`;
      } catch (err) {
        new Notice(
          `Mermaid diagram ${i + 1} could not be rendered: ${(err as Error).message}.`,
        );
      }
    }

    // Rebuild string in reverse order so earlier positions stay valid
    let result = markdown;
    for (let i = blocks.length - 1; i >= 0; i--) {
      result = result.slice(0, blocks[i].start) + replacements[i] + result.slice(blocks[i].end);
    }

    return {
      markdown: result,
      cleanup: async () => {
        for (const p of writtenPaths) {
          try { await app.vault.adapter.remove(p); } catch { /* leftover SVG is harmless */ }
        }
      },
    };
  }
  ```

- [ ] **Step 4: Run tests to confirm all five pass**

  ```bash
  cd /Users/albert/Projects/Omd2Typst@Github/obsidian-omd2typst && npm test -- --testPathPattern=mermaid 2>&1 | tail -8
  ```

  Expected: `5 passed, 5 total`

- [ ] **Step 5: Run full suite to confirm nothing regressed**

  ```bash
  cd /Users/albert/Projects/Omd2Typst@Github/obsidian-omd2typst && npm run lint && npm test 2>&1 | tail -6
  ```

  Expected: lint clean, `34 passed, 34 total` (29 existing + 5 new)

- [ ] **Step 6: Commit**

  ```bash
  cd /Users/albert/Projects/Omd2Typst@Github/obsidian-omd2typst
  git add src/mermaid.ts tests/mermaid.test.ts
  git commit -m "feat: add renderMermaidBlocks — render mermaid blocks to SVG before WASM"
  ```

---

## Task 2: Wire `renderMermaidBlocks` into `src/exporter.ts`

**Files:**
- Modify: `src/exporter.ts`

- [ ] **Step 1: Add the import and wrap the export body**

  In `src/exporter.ts`, add the import after the existing imports:

  ```typescript
  import { renderMermaidBlocks } from './mermaid';
  ```

  Replace the existing Step 1 (`const markdown = await app.vault.read(file);`) and the rest of the function body with the wrapped version:

  ```typescript
  export async function exportNote(
    file: TFile,
    format: OutputFormat,
    template: TemplateEntry | null,
    settings: Omd2TypstSettings,
    app: App,
  ): Promise<void> {
    // Step 1: Read and pre-process the note (renders mermaid blocks to temp SVGs)
    const rawMarkdown = await app.vault.read(file);
    const { markdown, cleanup } = await renderMermaidBlocks(rawMarkdown, app, file);
    try {
      // Step 2: Resolve template path for #import (verify file exists; null → built-in).
      // Prefixing with / makes the path vault-root-relative; typst resolves it from --root.
      let templatePath: string | null = null;
      if (template !== null && template.path) {
        const abstractFile = app.vault.getAbstractFileByPath(template.path);
        if (!(abstractFile instanceof TFile)) {
          throw new Error(`Template file not found or is a folder: '${template.path}'`);
        }
        templatePath = '/' + template.path;
      }

      // Step 3: Language compatibility check
      if (template !== null) {
        const noteLanguage =
          extractFrontmatterValue(markdown, 'language') ?? settings.defaultLanguage;
        const warning = checkLanguageCompatibility(template, noteLanguage);
        if (warning !== null) {
          new Notice(warning);
        }
      }

      // Step 4: Render to Typst
      const typstSrc = await renderToTypst(markdown, templatePath);

      // Step 5: Resolve output path
      const outputPath = resolveOutputPath(file.path, format, settings);
      if (outputPath === null) {
        throw new Error('ask-every-time output mode not yet implemented');
      }

      // Step 6: Write output
      if (format === 'typ') {
        await app.vault.adapter.write(outputPath, typstSrc);
      } else {
        // PDF: requires system typst CLI. Fall back to .typ if not installed.
        const bin = findTypstBinary();

        if (bin) {
          const adapter = app.vault.adapter;
          const vaultBase = adapter instanceof FileSystemAdapter ? adapter.getBasePath() : '';
          const pdfBytes = await compileToPdfViaCli(typstSrc, vaultBase);
          await app.vault.adapter.writeBinary(outputPath, pdfBytes.buffer as ArrayBuffer);
        } else {
          // No system typst — export .typ so the user has something useful.
          const typPath = resolveOutputPath(file.path, 'typ', settings)!;
          await app.vault.adapter.write(typPath, typstSrc);
          new Notice(
            'Typst not installed — exported as .typ instead. ' +
            'Install Typst from typst.app to enable PDF export.',
            8000,
          );
        }
      }
    } finally {
      await cleanup();
    }
  }
  ```

- [ ] **Step 2: Run lint and full test suite**

  ```bash
  cd /Users/albert/Projects/Omd2Typst@Github/obsidian-omd2typst && npm run lint && npm test 2>&1 | tail -6
  ```

  Expected: lint clean, `34 passed, 34 total`

  The existing exporter tests pass unchanged because their test markdown has no mermaid blocks — `renderMermaidBlocks` returns the original markdown unchanged without checking `window.mermaid`.

- [ ] **Step 3: Build to confirm it compiles**

  ```bash
  cd /Users/albert/Projects/Omd2Typst@Github/obsidian-omd2typst && node esbuild.config.mjs production 2>&1
  ```

  Expected: `main.js  ~1.8mb` with no errors.

- [ ] **Step 4: Commit**

  ```bash
  cd /Users/albert/Projects/Omd2Typst@Github/obsidian-omd2typst
  git add src/exporter.ts
  git commit -m "feat: wire mermaid rendering into export pipeline"
  ```

---

## Task 3: Release plugin v0.8.18

**Files:**
- Modify: `manifest.json`
- Modify: `package.json`
- Modify: `RELEASE_NOTES.md`

- [ ] **Step 1: Bump versions**

  In `manifest.json`, change `"version": "0.8.17"` to `"version": "0.8.18"`.

  In `package.json`, change `"version": "0.8.17"` to `"version": "0.8.18"`.

- [ ] **Step 2: Add release notes**

  Prepend the following section after the `# Release Notes` heading in `RELEASE_NOTES.md`:

  ```markdown
  ## v0.8.18 — Mermaid diagram support

  Mermaid code blocks are now rendered as diagrams in exported PDFs and `.typ` files.
  The plugin uses Obsidian's own bundled mermaid library — no extra tools or packages required.

  - Each ` ```mermaid ` block is rendered to SVG and embedded as an image in the export.
  - If a diagram cannot be rendered (e.g. invalid syntax), that block is left as a code listing
    and a notice is shown; other diagrams in the same note still render.
  - If Obsidian's mermaid library is unavailable, all blocks are left as code listings and a
    notice explains how to resolve it (usually: restart Obsidian).

  ---
  ```

- [ ] **Step 3: Commit, tag, and push**

  ```bash
  cd /Users/albert/Projects/Omd2Typst@Github/obsidian-omd2typst
  git add manifest.json package.json RELEASE_NOTES.md
  git commit -m "v0.8.18 — mermaid diagram support"
  git tag 0.8.18
  git push && git push --tags
  ```
