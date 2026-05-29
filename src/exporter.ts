import { Notice, TFile, App } from 'obsidian';
import type { OutputFormat, TemplateEntry, Omd2TypstSettings } from './settings';
import { checkLanguageCompatibility } from './template';
import { resolveOutputPath } from './output';
import { renderToTypst } from './wasm/omd2typst';
import { findTypstBinary, compileToPdfViaCli } from './typst-cli';
import { compileToPdfViaWasm, PDF_WASM_TYPST_VERSION } from './typst-pdf-wasm';

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
 *  1. Read the note content.
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
): Promise<void> {
  // Step 1: Read the note
  const markdown = await app.vault.read(file);

  // Step 2: Resolve template path for #import (verify file exists; null → built-in).
  // The renderer generates:  #import "<path>": template, callout
  // Prefixing with / makes the path vault-root-relative so:
  //   - WASM PDF: the vault access model strips / and reads from the vault.
  //   - CLI:      compile with --root <vault-root> and the path resolves correctly.
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
    // PDF: prefer system typst CLI; fall back to WASM compiler.
    const bin = findTypstBinary();
    let pdfBytes: Uint8Array;

    if (bin) {
      // System typst path: write .typ → run CLI → read PDF → remove .typ
      const typPath = outputPath.replace(/\.pdf$/, '.typ');
      await app.vault.adapter.write(typPath, typstSrc);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const vaultBase: string = (app.vault.adapter as any).basePath ?? '';
      try {
        pdfBytes = await compileToPdfViaCli(typPath, vaultBase);
      } finally {
        try { await app.vault.adapter.remove(typPath); } catch { /* best-effort */ }
      }
    } else {
      // WASM fallback: compile entirely in-memory (no temp files needed).
      // Collect vault files the template might import.
      const vaultFiles: Record<string, string> = {};
      if (template !== null && template.path) {
        const tplFile = app.vault.getAbstractFileByPath(template.path);
        if (tplFile instanceof TFile) {
          vaultFiles[template.path] = await app.vault.read(tplFile);
        }
      }

      new Notice(`PDF: using WASM compiler (Typst ${PDF_WASM_TYPST_VERSION}) — downloading if needed…`);
      const pluginDir = (app as any).plugins?.getPlugin?.('obsidian-omd2typst')?.manifest?.dir
        ?? '.obsidian/plugins/obsidian-omd2typst';
      pdfBytes = await compileToPdfViaWasm(typstSrc, vaultFiles, app, pluginDir);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (app.vault.adapter.write as any)(outputPath, pdfBytes);
  }
}
