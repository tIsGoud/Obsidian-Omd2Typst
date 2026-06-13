import { Notice, TFile, App, Component, FileSystemAdapter } from 'obsidian';
import type { OutputFormat, TemplateEntry, Omd2TypstSettings } from './settings';
import { checkLanguageCompatibility } from './template';
import { resolveOutputPath } from './output';
import { renderToTypst } from './wasm/omd2typst';
import { findTypstBinary, compileToPdfViaCli } from './typst-cli';
import { renderMermaidBlocks } from './mermaid';
import { renderBaseEmbeds } from './bases';

/**
 * Extract the value of a YAML key from the frontmatter block.
 * Returns the trimmed string value or null if not found.
 */
function extractFrontmatterValue(content: string, key: string): string | null {
  if (!content.startsWith('---')) return null;
  const afterOpen = content.slice(3);
  // Find the closing ---
  const closeIdx = afterOpen.indexOf('\n---');
  if (closeIdx === -1) return null;
  const yamlBlock = afterOpen.slice(0, closeIdx);

  for (const line of yamlBlock.split('\n')) {
    const colonIdx = line.indexOf(':');
    if (colonIdx === -1) continue;
    const k = line.slice(0, colonIdx).trim();
    if (k === key) {
      return line.slice(colonIdx + 1).trim() || null;
    }
  }
  return null;
}

/**
 * Export a note to Typst or PDF format.
 *
 * Steps:
 *  1. Read and pre-process the note (renders mermaid blocks to temp SVGs).
 *  2. Resolve template source (null for built-in).
 *  3. Check language compatibility (emit Notice on mismatch, do not abort).
 *  4. Render to Typst source.
 *  5. Resolve output path.
 *  6. Write output file(s).
 */
export async function exportNote(
  file: TFile,
  format: OutputFormat,
  template: TemplateEntry | null,
  settings: Omd2TypstSettings,
  app: App,
  parent?: Component,
): Promise<void> {
  // Step 1: Read and pre-process the note
  const rawMarkdown = await app.vault.read(file);
  // NOTE: v0.8.23 attempted to render bases via Obsidian's MarkdownRenderer
  // (Path A); it caused binary garbage to leak into the Typst output. The
  // `parent` parameter is now ignored; bases use the internal evaluator only.
  void parent;
  const markdownAfterBases = await renderBaseEmbeds(rawMarkdown, app, file);
  const { markdown, cleanup } = await renderMermaidBlocks(markdownAfterBases, app, file);
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
    if (format === 'pdf') {
      await cleanup();
    }
  }
}
