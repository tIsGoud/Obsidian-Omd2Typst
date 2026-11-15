/* @ts-self-types="./omd2typst_wasm.d.ts" */
import * as wasm from "./omd2typst_wasm_bg.wasm";
import { __wbg_set_wasm } from "./omd2typst_wasm_bg.js";

__wbg_set_wasm(wasm);

export {
    get_builtin_template, render_to_typst
} from "./omd2typst_wasm_bg.js";
