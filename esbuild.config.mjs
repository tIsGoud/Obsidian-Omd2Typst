import esbuild from 'esbuild';
import { wasmLoader } from 'esbuild-plugin-wasm';
import builtins from 'builtin-modules';
import { copyFile, mkdir } from 'fs/promises';
import process from 'process';

const prod = process.argv[2] === 'production';

// Copy the large Typst WASM to the plugin root so it can be loaded at runtime.
// The omd2typst WASM is small enough to inline via wasmLoader().
await mkdir('wasm-runtime', { recursive: true });
await copyFile(
  'node_modules/@myriaddreamin/typst-ts-web-compiler/pkg/typst_ts_web_compiler_bg.wasm',
  'wasm-runtime/typst_compiler.wasm',
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
  target: 'es2018',
  sourcemap: prod ? false : 'inline',
  treeShaking: true,
  outfile: 'main.js',
  minify: prod,
  plugins: [wasmLoader()],  // inlines omd2typst WASM as base64 in main.js
  logLevel: 'info',
});
