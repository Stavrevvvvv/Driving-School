import { defineConfig } from 'eslint/config'
import { createRequire } from 'module'

const require = createRequire(import.meta.url)
const coreWebVitals = require('eslint-config-next/core-web-vitals')
const typescript = require('eslint-config-next/typescript')

export default defineConfig([
  ...coreWebVitals,
  ...typescript,
  {
    ignores: ['.next/**', 'out/**', 'build/**', 'next-env.d.ts'],
  },
])
