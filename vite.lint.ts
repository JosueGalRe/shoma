import type { UserConfig } from 'vite-plus'

/**
 * Accessibility rules oxlint runs natively; they used to come mirrored through react-doctor.
 */
const a11yRules = {
  'jsx-a11y/alt-text': 'error',
  'jsx-a11y/anchor-is-valid': 'error',
  'jsx-a11y/aria-props': 'error',
  'jsx-a11y/aria-proptypes': 'error',
  'jsx-a11y/aria-role': 'error',
  'jsx-a11y/aria-unsupported-elements': 'error',
  'jsx-a11y/click-events-have-key-events': 'error',
  'jsx-a11y/heading-has-content': 'error',
  'jsx-a11y/html-has-lang': 'error',
  'jsx-a11y/iframe-has-title': 'error',
  'jsx-a11y/img-redundant-alt': 'warn',
  'jsx-a11y/interactive-supports-focus': 'error',
  'jsx-a11y/label-has-associated-control': 'error',
  'jsx-a11y/mouse-events-have-key-events': 'warn',
  'jsx-a11y/no-access-key': 'error',
  'jsx-a11y/no-aria-hidden-on-focusable': 'error',
  'jsx-a11y/no-autofocus': 'warn',
  'jsx-a11y/no-distracting-elements': 'error',
  'jsx-a11y/no-noninteractive-element-interactions': 'warn',
  'jsx-a11y/no-noninteractive-tabindex': 'error',
  'jsx-a11y/no-redundant-roles': 'error',
  'jsx-a11y/no-static-element-interactions': 'warn',
  'jsx-a11y/role-has-required-aria-props': 'error',
  'jsx-a11y/role-supports-aria-props': 'error',
  'jsx-a11y/scope': 'error',
  'jsx-a11y/tabindex-no-positive': 'error',
  // Current UI uses role="dialog"/role="button" on divs (8 hits); re-enable with the redesign's design system.
  'jsx-a11y/control-has-associated-label': 'off',
  'jsx-a11y/prefer-tag-over-role': 'off',
} as const

export const lintConfig: UserConfig['lint'] = {
  categories: {
    correctness: 'error',
    style: 'warn',
    suspicious: 'error',
  },
  env: {
    browser: true,
    builtin: true,
    node: true,
  },
  jsPlugins: [
    {
      name: 'perfectionist',
      specifier: 'eslint-plugin-perfectionist',
    },
    {
      name: 'tanstack-router',
      specifier: '@tanstack/eslint-plugin-router',
    },
    {
      name: 'style',
      specifier: '@stylistic/eslint-plugin',
    },
    {
      name: 'stylex',
      specifier: '@stylexjs/eslint-plugin',
    },
    './tools/oxlint-plugin-custom/index.js',
  ],
  options: {
    typeAware: true,
    typeCheck: true,
  },
  overrides: [
    {
      files: ['**/*.ts', '**/*.tsx', '**/*.mts', '**/*.cts'],
      rules: {
        'constructor-super': 'off',
        'getter-return': 'off',
        'no-class-assign': 'off',
        'no-const-assign': 'off',
        'no-dupe-class-members': 'off',
        'no-dupe-keys': 'off',
        'no-func-assign': 'off',
        'no-import-assign': 'off',
        'no-new-native-nonconstructor': 'off',
        'no-obj-calls': 'off',
        'no-redeclare': 'off',
        'no-setter-return': 'off',
        'no-this-before-super': 'off',
        'no-undef': 'off',
        'no-unreachable': 'off',
        'no-unsafe-negation': 'off',
        'no-var': 'error',
        'no-with': 'off',
        'prefer-const': 'error',
        'prefer-rest-params': 'error',
        'prefer-spread': 'error',
      },
    },
    {
      files: ['**/routeTree.gen.ts', '**/bun-test.d.ts'],
      rules: {
        'arrow-body-style': 'off',
        curly: 'off',
        'no-nested-ternary': 'off',
        'typescript/consistent-type-assertions': 'off',
        'typescript/consistent-type-imports': 'off',
      },
    },
    {
      files: ['packages/ui/src/**/*.{ts,tsx}', '**/*-styles.ts'],
      rules: {
        // StyleX only compiles dynamic styles written as `(x) => ({ ... })`; a block body fails the build.
        'arrow-body-style': 'off',
      },
    },
    {
      files: ['packages/design-system/src/components/**/*.{ts,tsx}', 'loom/src/components/ui/**/*.{ts,tsx}'],
      rules: {
        // Design-system primitives forward native props by spreading.
        'react/jsx-props-no-spreading': 'off',
      },
    },
    {
      files: [
        'scripts/**/*',
        '**/tests/**/*',
        '**/*.test.ts',
        '**/*.test.tsx',
        '**/*-test.ts',
        '**/*-test.tsx',
        'vite.*.ts',
        'vitest.config.*',
        'playwright.config.*',
        'conduit/vite.config.ts',
        'loom/vite.config.ts',
        'leyline/vite.config.ts',
      ],
      rules: {
        'import/no-nodejs-modules': 'off',
        'unicorn/prefer-global-this': 'off',
      },
    },
    {
      env: {
        es2026: true,
      },
      files: [
        'conduit/**/*.{js,jsx,ts,tsx}',
        'leyline/**/*.{js,jsx,ts,tsx}',
        'loom/**/*.{js,jsx,ts,tsx}',
        'packages/**/*.{js,jsx,ts,tsx}',
      ],
    },
  ],
  plugins: ['eslint', 'import', 'jsx-a11y', 'oxc', 'react', 'typescript', 'unicorn'],
  rules: {
    ...a11yRules,
    'arrow-body-style': ['error', 'always'],

    'constructor-super': 'error',

    curly: ['error', 'all'],

    'custom-imports/no-duplicate-imports': 'off',

    'eslint/id-length': 'off',

    'eslint/no-underscore-dangle': ['error', { allow: ['__shomaMockLcu', '__shomaHarnessRoot'] }],

    'eslint/init-declarations': 'off',

    'eslint/max-statements': 'off',

    'eslint/no-magic-numbers': 'off',

    'eslint/no-ternary': 'off',

    'eslint/one-var': 'off',

    'eslint/sort-imports': 'off',

    'for-direction': 'error',

    'func-style': ['error', 'declaration', { allowArrowFunctions: true }],

    'getter-return': 'error',

    'import/consistent-type-specifier-style': 'off',

    'import/exports-last': 'off',

    'import/group-exports': 'off',

    'import/no-named-export': 'off',

    'import/prefer-default-export': 'off',

    'new-cap': 'off',

    'no-array-constructor': 'error',

    'no-async-promise-executor': 'error',

    'no-case-declarations': 'error',

    'no-class-assign': 'error',

    'no-compare-neg-zero': 'error',

    'no-cond-assign': 'error',

    'no-const-assign': 'error',

    'no-constant-binary-expression': 'error',

    'no-constant-condition': 'error',

    'no-control-regex': 'error',

    'no-debugger': 'error',

    'no-delete-var': 'error',

    'no-dupe-class-members': 'error',

    'no-dupe-else-if': 'error',

    'no-dupe-keys': 'error',

    'no-duplicate-case': 'error',

    'no-duplicate-imports': 'off',

    'no-empty': 'error',

    'no-empty-character-class': 'error',

    'no-empty-pattern': 'error',

    'no-empty-static-block': 'error',

    'no-ex-assign': 'error',

    'no-extra-boolean-cast': 'error',

    'no-fallthrough': 'error',

    'no-func-assign': 'error',

    'no-global-assign': 'error',

    'no-import-assign': 'error',

    'no-invalid-regexp': 'error',

    'no-irregular-whitespace': 'error',

    'no-loss-of-precision': 'error',

    'no-misleading-character-class': 'error',

    'no-nested-ternary': 'error',

    'no-new-native-nonconstructor': 'error',

    'no-nonoctal-decimal-escape': 'error',

    'no-obj-calls': 'error',

    'no-prototype-builtins': 'error',

    'no-redeclare': 'error',

    'no-regex-spaces': 'error',

    'no-self-assign': 'error',

    'no-setter-return': 'error',

    'no-shadow-restricted-names': 'error',

    'no-sparse-arrays': 'error',

    'no-this-before-super': 'error',

    'no-unassigned-vars': 'error',

    'no-undef': 'error',

    'no-unexpected-multiline': 'error',

    'no-unreachable': 'error',

    'no-unsafe-finally': 'error',

    'no-unsafe-negation': 'error',

    'no-unsafe-optional-chaining': 'error',

    'no-unused-expressions': 'error',

    'no-unused-labels': 'error',

    'no-unused-private-class-members': 'error',

    'no-unused-vars': 'error',

    'no-useless-assignment': 'error',

    'no-useless-backreference': 'error',

    'no-useless-catch': 'error',

    'no-useless-escape': 'error',

    'no-with': 'error',

    'perfectionist/sort-exports': [
      'error',
      {
        order: 'asc',
        type: 'natural',
      },
    ],

    'perfectionist/sort-imports': [
      'error',
      {
        customGroups: [
          {
            elementNamePattern: ['^react$'],
            groupName: 'react',
            selector: 'type',
          },
          {
            elementNamePattern: ['^react$'],
            groupName: 'react',
          },
        ],
        groups: ['builtin', 'react', 'external', 'internal', 'parent', 'sibling', 'index', 'type'],
        internalPattern: [
          // Keep Perfectionist's default aliases when overriding this array.
          '^@/.+',
          '^~/.+',
          '^#.+',
          '^app',
          '^assets',
          '^auth',
          '^components',
          '^config',
          '^constants',
          '^hooks',
          '^icons',
          '^interfaces',
          '^lab',
          '^layout',
          '^locales',
          '^middlewares',
          '^mocks',
          '^pages',
          '^plugins',
          '^providers',
          '^router',
          '^services',
          '^store',
          '^styles',
          '^tests',
          '^theme',
          '^types',
          '^utils',
          '^views',
        ],
        newlinesBetween: 1,
      },
    ],

    'perfectionist/sort-named-exports': [
      'error',
      {
        order: 'asc',
        type: 'natural',
      },
    ],

    'perfectionist/sort-named-imports': [
      'error',
      {
        order: 'asc',
        type: 'natural',
      },
    ],

    'preserve-caught-error': 'error',

    // React Compiler rules oxlint 1.91 added natively; never enforced before, existing violations are pending fixes.
    'react/capitalized-calls': 'off',

    'react/exhaustive-deps': 'warn',

    'react/exhaustive-effect-dependencies': 'off',

    'react/globals': 'off',

    'react/immutability': 'off',

    'react/jsx-max-depth': 'off',

    'react/only-export-components': [
      'warn',
      {
        allowConstantExport: true,
      },
    ],

    'react/purity': 'off',

    'react/react-in-jsx-scope': 'off',

    // Off by design, same as react-hooks/refs before
    'react/refs': 'off',

    'react/rules-of-hooks': 'error',

    'react/set-state-in-effect': 'off',

    'require-yield': 'error',

    'style/jsx-newline': ['error'],

    'style/max-len': 'off',

    'style/padding-line-between-statements': [
      'error',
      {
        blankLine: 'always',
        next: ['*'],
        prev: [
          'const',
          'for',
          'function',
          'if',
          'let',
          'multiline-const',
          'multiline-expression',
          'multiline-let',
          'switch',
          'try',
          'while',
        ],
      },
      {
        blankLine: 'always',
        next: [
          'const',
          'for',
          'function',
          'if',
          'let',
          'multiline-const',
          'multiline-expression',
          'multiline-let',
          'switch',
          'try',
          'while',
        ],
        prev: ['*'],
      },
      {
        blankLine: 'any',
        next: ['const', 'let'],
        prev: ['const', 'let'],
      },
      {
        blankLine: 'always',
        next: ['return'],
        prev: ['*'],
      },
    ],

    'stylex/enforce-extension': 'error',

    'stylex/no-conflicting-props': 'error',

    'stylex/no-unused': 'error',

    'stylex/valid-shorthands': 'error',

    'stylex/valid-styles': 'error',

    'tanstack-router/create-route-property-order': 'error',

    'typescript/ban-ts-comment': 'error',

    'typescript/consistent-type-assertions': [
      'error',
      {
        assertionStyle: 'never',
      },
    ],

    'typescript/consistent-type-imports': 'error',

    'typescript/no-duplicate-enum-values': 'error',

    'typescript/no-empty-object-type': 'error',

    'typescript/no-explicit-any': 'error',

    'typescript/no-extra-non-null-assertion': 'error',

    'typescript/no-misused-new': 'error',

    'typescript/no-namespace': 'error',

    'typescript/no-non-null-asserted-optional-chain': 'error',

    'typescript/no-require-imports': 'error',

    'typescript/no-this-alias': 'error',

    'typescript/no-unnecessary-type-constraint': 'error',

    'typescript/no-unsafe-declaration-merging': 'error',

    'typescript/no-unsafe-function-type': 'error',

    'typescript/no-wrapper-object-types': 'error',

    'typescript/prefer-as-const': 'error',

    'typescript/method-signature-style': 'off',
    'typescript/prefer-namespace-keyword': 'error',
    'unicorn/filename-case': [
      'error',
      {
        case: 'kebabCase',
        ignore: ['^__root$', '^vite-env$', String.raw`^routeTree\.gen$`],
      },
    ],

    'unicorn/max-nested-calls': 'off',
    'unicorn/no-null': 'off',
    'unicorn/prefer-export-from': 'off',

    'use-isnan': 'error',

    'valid-typeof': 'error',
  },
}
