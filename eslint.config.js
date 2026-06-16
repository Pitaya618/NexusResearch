import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  // 忽略：构建产物、依赖、Python 后端、Electron 产物
  globalIgnores([
    'dist',
    'node_modules',
    'apps/desktop/dist',
    'apps/desktop/out',
    'server/**',        // Python 后端，不参与 TS lint
    'tools/codegen/dist',
  ]),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
    },
  },
])
