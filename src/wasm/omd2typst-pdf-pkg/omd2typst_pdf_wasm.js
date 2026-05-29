/* @ts-self-types="./omd2typst_pdf_wasm.d.ts" */
import * as wasm from "./omd2typst_pdf_wasm_bg.wasm";
import { __wbg_set_wasm } from "./omd2typst_pdf_wasm_bg.js";

__wbg_set_wasm(wasm);

export {
    render_to_pdf, typst_version
} from "./omd2typst_pdf_wasm_bg.js";
