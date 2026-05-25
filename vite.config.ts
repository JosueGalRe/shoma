import { defineConfig } from 'vite-plus'

import { fmtConfig } from './vite.fmt.ts'
import { lintConfig } from './vite.lint.ts'

const ignorePatterns = [
  '**/node_modules/**',
  '**/dist/**',
  '**/*.d.ts',
  '**/bun-test.d.ts',
  '**/routeTree.gen.ts',
  '**/tsconfig.tsbuildinfo',
  'leyline/**',
  'loom/tests/**',
  'loom/src/**/*.test.ts',
  'loom/src/testing/**',
  'legacy/**',
  '**/routeTree.gen.ts',
]

export default defineConfig({
  fmt: { ...fmtConfig, ignorePatterns },
  lint: { ...lintConfig, ignorePatterns },
})
