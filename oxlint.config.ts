import { defineConfig } from 'oxlint'

export default defineConfig({
  plugins: ['typescript', 'import', 'react', 'unicorn'],
  jsPlugins: [
    {
      name: 'tanstack-router',
      specifier: '@tanstack/eslint-plugin-router',
    },
  ],
  env: {
    browser: true,
    node: true,
  },
  rules: {
    '@typescript-eslint/no-explicit-any': 'error',
    'func-style': ['error', 'declaration', { allowArrowFunctions: true }],
    'unicorn/filename-case': [
      'error',
      {
        case: 'kebabCase',
        ignore: ['^__root$', '^vite-env$', '^routeTree\\.gen$'],
      },
    ],
    'tanstack-router/create-route-property-order': 'error',
  },
  overrides: [
    {
      files: ['apps/web-next/**/*.{ts,tsx}'],
      rules: {
        'tanstack-router/create-route-property-order': 'error',
      },
    },
  ],
  ignorePatterns: [
    '**/node_modules/**',
    '**/dist/**',
    '**/*.d.ts',
    '**/routeTree.gen.ts',
    '**/tsconfig.tsbuildinfo',
    'rift/**',
    'web/**',
  ],
})
