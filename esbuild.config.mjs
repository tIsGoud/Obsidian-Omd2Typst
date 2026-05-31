import esbuild from 'esbuild';
import { builtinModules as builtins } from 'module';
import process from 'process';

const prod = process.argv[2] === 'production';

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
  minify: false,
  loader: { '.wasm': 'binary' },
  plugins: [],
  logLevel: 'info',
});
