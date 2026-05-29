/* tslint:disable */
/* eslint-disable */

/**
 * Compile Typst source to a PDF byte array.
 *
 * `typ_source`  — full Typst source document (output of render_to_typst).
 * `files_json`  — JSON object mapping vault-relative paths to UTF-8 file
 *                 contents (e.g. `{ "typst/my-template.typ": "..." }`).
 *                 Required for any `#import` paths the document references.
 */
export function render_to_pdf(typ_source: string, files_json: string): Uint8Array;

/**
 * Return the Typst compiler version embedded in this module.
 */
export function typst_version(): string;
