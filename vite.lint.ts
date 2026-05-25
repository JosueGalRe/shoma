import { ALL_REACT_DOCTOR_RULES, type OxlintRuleSeverity, RECOMMENDED_RULES, TANSTACK_QUERY_RULES } from 'oxlint-plugin-react-doctor'

import type { UserConfig } from 'vite-plus'

type ReactDoctorRules = Record<string, OxlintRuleSeverity>

const pickAvailableReactDoctorRules = (rules: ReactDoctorRules): ReactDoctorRules => {
  return Object.fromEntries(
    Object.entries(rules).filter(([ruleName]) => {
      return ruleName in ALL_REACT_DOCTOR_RULES
    }),
  )
}

const offAvailableReactDoctorMirrors = (suffixes: string[]): ReactDoctorRules => {
  return Object.keys(ALL_REACT_DOCTOR_RULES).reduce<ReactDoctorRules>((rules, ruleName) => {
      if (suffixes.some((suffix) => {
        return ruleName.endsWith(`/${suffix}`)
      })) {
        rules[ruleName] = 'off'
      }

      return rules
    }, {})
}

const strictReactDoctorRules = pickAvailableReactDoctorRules({
  'react-doctor/client-localstorage-no-version': 'warn',
  'react-doctor/client-passive-event-listeners': 'warn',
  'react-doctor/effect-needs-cleanup': 'error',
  'react-doctor/no-adjust-state-on-prop-change': 'error',
  'react-doctor/no-array-index-as-key': 'warn',
  'react-doctor/no-barrel-import': 'warn',
  'react-doctor/no-cascading-set-state': 'error',
  'react-doctor/no-chain-state-updates': 'error',
  /**
   * You Might Not Need an Effect family.
   */
  'react-doctor/no-derived-state': 'error',
  /**
   * State / effects.
   * Estas son las más importantes para evitar React “feo” generado por agentes.
   */
  'react-doctor/no-derived-state-effect': 'error',
  'react-doctor/no-derived-useState': 'error',
  'react-doctor/no-direct-state-mutation': 'error',
  'react-doctor/no-dynamic-import-path': 'warn',
  'react-doctor/no-effect-event-handler': 'error',
  'react-doctor/no-effect-event-in-deps': 'error',
  /**
   * Security / bundle hygiene.
   */
  'react-doctor/no-eval': 'error',
  'react-doctor/no-event-handler': 'error',
  'react-doctor/no-flush-sync': 'error',
  'react-doctor/no-full-lodash-import': 'error',
  'react-doctor/no-giant-component': 'warn',
  'react-doctor/no-global-css-variable-animation': 'error',
  'react-doctor/no-initialize-state': 'error',
  'react-doctor/no-inline-prop-on-memo-component': 'warn',
  'react-doctor/no-large-animated-blur': 'warn',
  /**
   * Rendering / performance.
   */
  'react-doctor/no-layout-property-animation': 'error',
  'react-doctor/no-many-boolean-props': 'warn',
  'react-doctor/no-mirror-prop-effect': 'error',
  'react-doctor/no-moment': 'error',
  'react-doctor/no-mutable-in-deps': 'error',
  /**
   * Component architecture.
   */
  'react-doctor/no-nested-component-definition': 'error',
  'react-doctor/no-pass-data-to-parent': 'warn',
  'react-doctor/no-pass-live-state-to-parent': 'warn',
  'react-doctor/no-permanent-will-change': 'warn',
  /**
   * Client correctness.
   */
  'react-doctor/no-prevent-default': 'warn',
  'react-doctor/no-render-in-render': 'error',
  'react-doctor/no-render-prop-children': 'warn',
  'react-doctor/no-reset-all-state-on-prop-change': 'error',
  'react-doctor/no-secrets-in-client-code': 'error',
  'react-doctor/no-set-state-in-render': 'error',
  'react-doctor/no-transition-all': 'warn',
  'react-doctor/no-uncontrolled-input': 'warn',
  'react-doctor/prefer-dynamic-import': 'warn',
  'react-doctor/rerender-dependencies': 'error',
  'react-doctor/rerender-functional-setstate': 'error',
})

const strictA11yRules = pickAvailableReactDoctorRules({
  /**
   * A11y.
   */
  'react-doctor/alt-text': 'error',
  'react-doctor/anchor-is-valid': 'error',
  'react-doctor/aria-props': 'error',
  'react-doctor/aria-proptypes': 'error',
  'react-doctor/aria-role': 'error',
  'react-doctor/aria-unsupported-elements': 'error',
  'react-doctor/click-events-have-key-events': 'error',
  'react-doctor/heading-has-content': 'error',
  'react-doctor/html-has-lang': 'error',
  'react-doctor/iframe-has-title': 'error',
  'react-doctor/img-redundant-alt': 'warn',
  'react-doctor/interactive-supports-focus': 'error',
  'react-doctor/label-has-associated-control': 'error',
  'react-doctor/mouse-events-have-key-events': 'warn',
  'react-doctor/no-access-key': 'error',
  'react-doctor/no-aria-hidden-on-focusable': 'error',
  'react-doctor/no-autofocus': 'warn',
  'react-doctor/no-distracting-elements': 'error',
  'react-doctor/no-noninteractive-element-interactions': 'warn',
  'react-doctor/no-noninteractive-tabindex': 'error',
  'react-doctor/no-redundant-roles': 'error',
  'react-doctor/no-static-element-interactions': 'warn',
  'react-doctor/role-has-required-aria-props': 'error',
  'react-doctor/role-supports-aria-props': 'error',
  'react-doctor/scope': 'error',
  'react-doctor/tabindex-no-positive': 'error',
})

const disabledReactDoctorMirrors = offAvailableReactDoctorMirrors([
  'rules-of-hooks',
  'exhaustive-deps',
  'react-in-jsx-scope',
  'only-export-components',
])

export const reactDoctorRules = {
  ...RECOMMENDED_RULES,

  ...strictReactDoctorRules,
  ...strictA11yRules,

  ...TANSTACK_QUERY_RULES,

  ...disabledReactDoctorMirrors,
} satisfies ReactDoctorRules

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
      name: 'react-doctor',
      specifier: 'oxlint-plugin-react-doctor',
    },
    {
      name: 'style',
      specifier: '@stylistic/eslint-plugin',
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
  plugins: ['eslint', 'import', 'oxc', 'react', 'typescript', 'unicorn'],
  rules: {
    ...reactDoctorRules,
    'arrow-body-style': ['error', 'always'],

    'constructor-super': 'error',

    curly: ['error', 'all'],

    'custom-imports/no-duplicate-imports': [
      'error',
      {
        considerQueryString: false,
        ignoreDeclareModules: false,
        includeExports: false,
        preferInline: true,
      },
    ],

    'eslint/id-length': 'off',

    'eslint/init-declarations': 'off',

    'eslint/max-statements': 'off',

    'eslint/no-magic-numbers': 'off',

    'eslint/no-ternary': 'off',

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

    'react-doctor/forbid-component-props': 'off',

    'react/exhaustive-deps': 'warn',

    'react/jsx-max-depth': 'off',

    'react/only-export-components': [
      'warn',
      {
        allowConstantExport: true,
      },
    ],

    'react/react-in-jsx-scope': 'off',

    'react/rules-of-hooks': 'error',

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

    'typescript/prefer-namespace-keyword': 'error',

    'typescript/triple-slash-reference': 'error',

    'unicorn/filename-case': [
      'error',
      {
        case: 'kebabCase',
        ignore: ['^__root$', '^vite-env$', String.raw`^routeTree\.gen$`],
      },
    ],

    'unicorn/no-null': 'off',

    'use-isnan': 'error',

    'valid-typeof': 'error',
  },
}
