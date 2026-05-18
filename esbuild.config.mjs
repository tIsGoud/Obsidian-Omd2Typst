import esbuild from 'esbuild';
import builtins from 'builtin-modules';
import { copyFile, mkdir } from 'fs/promises';
import process from 'process';

const prod = process.argv[2] === 'production';

// Copy both WASM files to wasm-runtime/ so they can be loaded at runtime
// via fetch() (async instantiation avoids Chrome's 4 KB sync-compile limit).
await mkdir('wasm-runtime', { recursive: true });
await copyFile(
  'node_modules/@myriaddreamin/typst-ts-web-compiler/pkg/typst_ts_web_compiler_bg.wasm',
  'wasm-runtime/typst_compiler.wasm',
);
await copyFile(
  'src/wasm/omd2typst-pkg/omd2typst_wasm_bg.wasm',
  'wasm-runtime/omd2typst_bg.wasm',
);

const OBSIDIAN_EXTERNALS = [
  'obsidian', 'electron',
  '@codemirror/autocomplete', '@codemirror/collab', '@codemirror/commands',
  '@codemirror/language', '@codemirror/lint', '@codemirror/search',
  '@codemirror/state', '@codemirror/view',
  '@lezer/common', '@lezer/highlight', '@lezer/lr',
  ...builtins,
];


await esbuild.build({
  entryPoints: ['src/main.ts'],
  bundle: true,
  external: OBSIDIAN_EXTERNALS,
  format: 'cjs',
  target: 'es2022',
  sourcemap: prod ? false : 'inline',
  treeShaking: true,
  outfile: 'main.js',
  minify: prod,
  plugins: [],
  logLevel: 'info',
});
