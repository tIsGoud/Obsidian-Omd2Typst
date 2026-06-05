import obsidianmd from 'eslint-plugin-obsidianmd';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default [
  { ignores: ['src/__mocks__/**', 'src/wasm/omd2typst-pkg/**'] },
  ...obsidianmd.configs.recommended,
  {
    languageOptions: {
      parserOptions: {
        project: './tsconfig.json',
        tsconfigRootDir: __dirname,
      },
    },
  },
];
