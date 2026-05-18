import esbuild from 'esbuild';
import builtins from 'builtin-modules';
import { copyFile, mkdir, readFile } from 'fs/promises';
import { readFileSync } from 'fs';
import path from 'path';
import process from 'process';

const prod = process.argv[2] === 'production';

// Copy the large Typst WASM to the plugin root so it can be loaded at runtime.
// The omd2typst WASM is small enough to inline via a custom synchronous loader.
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

/**
 * Custom esbuild plugin: loads .wasm files synchronously (no top-level await)
 * so they are compatible with the CJS output format required by Obsidian plugins.
 *
 * Strategy:
 *   1. Intercept .wasm imports, read the binary at build time.
 *   2. Emit a virtual ESM module that base64-decodes the WASM bytes and calls
 *      the synchronous WebAssembly.Module + WebAssembly.Instance constructors.
 *   3. Re-export all instance exports as named exports.
 *
 * Synchronous WASM compilation is supported in Electron (all Obsidian platforms).
 */
function syncWasmPlugin() {
  return {
    name: 'sync-wasm',
    setup(build) {
      // Intercept .wasm imports at the 'wasm-sync' namespace stage
      build.onResolve({ filter: /\.wasm$/ }, args => {
        if (args.namespace === 'wasm-sync') return;
        const absPath = path.isAbsolute(args.path)
          ? args.path
          : path.join(args.resolveDir, args.path);
        return { path: absPath, namespace: 'wasm-sync' };
      });

      build.onLoad({ filter: /.*/, namespace: 'wasm-sync' }, args => {
        const wasmBytes = readFileSync(args.path);
        const b64 = wasmBytes.toString('base64');
        const resolveDir = path.dirname(args.path);

        // Introspect the WASM module at build time to know its imports/exports.
        const wasmModule = new WebAssembly.Module(wasmBytes);
        const wasmImports = WebAssembly.Module.imports(wasmModule);
        const wasmExports = WebAssembly.Module.exports(wasmModule);

        // Build the import-statement list and the importObject.
        // Group imports by module name.
        const importsByModule = new Map();
        for (const { module, name } of wasmImports) {
          if (!importsByModule.has(module)) importsByModule.set(module, []);
          importsByModule.get(module).push(name);
        }

        const importStatements = [];
        const importObjectEntries = [];
        let importIdx = 0;
        for (const [mod, names] of importsByModule) {
          const alias = `__wasm_import_${importIdx++}`;
          importStatements.push(
            `import { ${names.join(', ')} } from ${JSON.stringify(mod)};`
          );
          importObjectEntries.push(
            `  ${JSON.stringify(mod)}: { ${names.join(', ')} }`
          );
        }

        const exportNames = wasmExports.map(e => e.name);
        const exportLine = exportNames.length > 0
          ? `export const { ${exportNames.join(', ')} } = __wasm_instance.exports;`
          : '';

        const contents = `
${importStatements.join('\n')}

const __wasm_b64 = ${JSON.stringify(b64)};
const __wasm_bytes = Uint8Array.from(atob(__wasm_b64), c => c.charCodeAt(0));
const __wasm_module = new WebAssembly.Module(__wasm_bytes);
const __wasm_imports = {
${importObjectEntries.join(',\n')}
};
const __wasm_instance = new WebAssembly.Instance(__wasm_module, __wasm_imports);
${exportLine}
`.trim();

        return { contents, resolveDir, loader: 'js' };
      });
    },
  };
}

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
  plugins: [syncWasmPlugin()],
  logLevel: 'info',
});
