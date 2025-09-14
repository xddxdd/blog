import { defineConfig, globalIgnores } from 'eslint/config'
import eslint from '@eslint/js'
import tseslint from 'typescript-eslint'
import eslintPluginAstro from 'eslint-plugin-astro'
import simpleImportSort from 'eslint-plugin-simple-import-sort'

export default defineConfig(
  eslint.configs.recommended,
  ...tseslint.configs.strict,
  ...eslintPluginAstro.configs.recommended,
  {
    plugins: {
      'simple-import-sort': simpleImportSort,
    },
    rules: {
      'simple-import-sort/imports': 'error',
      'simple-import-sort/exports': 'error',
    },
  },
  globalIgnores(['dist/', 'public/', '*.config.*', '.*'])
)
