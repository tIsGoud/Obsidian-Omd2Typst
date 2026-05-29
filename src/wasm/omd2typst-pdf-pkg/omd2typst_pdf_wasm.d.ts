/* tslint:disable */
/* eslint-disable */

/**
 * Compile Typst source to a PDF byte array.
 *
 * `typ_source`        — full Typst source document (output of render_to_typst).
 * `files_json`        — JSON object mapping vault-relative paths to UTF-8 file
 *                       contents (e.g. `{ "typst/my-template.typ": "..." }`).
 *                       Required for any `#import` paths the document references.
 * `binary_files_json` — JSON object mapping vault-relative paths to standard
 *                       base64-encoded binary content (e.g. images). Pass `"{}"`
 *                       if there are no binary files.
 */
export function render_to_pdf(typ_source: string, files_json: string, binary_files_json: string): Uint8Array;

/**
 * Return the Typst compiler version embedded in this module.
 */
export function typst_version(): string;

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
    readonly memory: WebAssembly.Memory;
    readonly render_to_pdf: (a: number, b: number, c: number, d: number, e: number, f: number, g: number) => void;
    readonly typst_version: (a: number) => void;
    readonly lut_inverse_interp16: (a: number, b: number, c: number) => number;
    readonly qcms_profile_precache_output_transform: (a: number) => void;
    readonly qcms_white_point_sRGB: (a: number) => void;
    readonly qcms_transform_data_rgb_out_lut: (a: number, b: number, c: number, d: number) => void;
    readonly qcms_transform_data_rgba_out_lut: (a: number, b: number, c: number, d: number) => void;
    readonly qcms_transform_data_bgra_out_lut: (a: number, b: number, c: number, d: number) => void;
    readonly qcms_transform_data_rgb_out_lut_precache: (a: number, b: number, c: number, d: number) => void;
    readonly qcms_transform_data_rgba_out_lut_precache: (a: number, b: number, c: number, d: number) => void;
    readonly qcms_transform_data_bgra_out_lut_precache: (a: number, b: number, c: number, d: number) => void;
    readonly lut_interp_linear16: (a: number, b: number, c: number) => number;
    readonly qcms_enable_iccv4: () => void;
    readonly qcms_profile_is_bogus: (a: number) => number;
    readonly qcms_transform_release: (a: number) => void;
    readonly __wbindgen_add_to_stack_pointer: (a: number) => number;
    readonly __wbindgen_export: (a: number, b: number) => number;
    readonly __wbindgen_export2: (a: number, b: number, c: number, d: number) => number;
    readonly __wbindgen_export3: (a: number, b: number, c: number) => void;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;

/**
 * Instantiates the given `module`, which can either be bytes or
 * a precompiled `WebAssembly.Module`.
 *
 * @param {{ module: SyncInitInput }} module - Passing `SyncInitInput` directly is deprecated.
 *
 * @returns {InitOutput}
 */
export function initSync(module: { module: SyncInitInput } | SyncInitInput): InitOutput;

/**
 * If `module_or_path` is {RequestInfo} or {URL}, makes a request and
 * for everything else, calls `WebAssembly.instantiate` directly.
 *
 * @param {{ module_or_path: InitInput | Promise<InitInput> }} module_or_path - Passing `InitInput` directly is deprecated.
 *
 * @returns {Promise<InitOutput>}
 */
export default function __wbg_init (module_or_path?: { module_or_path: InitInput | Promise<InitInput> } | InitInput | Promise<InitInput>): Promise<InitOutput>;
