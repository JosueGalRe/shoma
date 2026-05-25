import type { UserConfig } from 'vite-plus'

export const fmtConfig: UserConfig['fmt'] = {
  arrowParens: 'always',
  bracketSameLine: false,
  bracketSpacing: true,
  endOfLine: 'lf',
  insertFinalNewline: true,
  jsxSingleQuote: false,
  printWidth: 128,
  quoteProps: 'as-needed',
  semi: false,
  singleQuote: true,
  sortImports: false,
  sortTailwindcss: {
    attributes: ['className', 'class'],
    functions: ['clsx', 'cn', 'cva', 'twMerge', 'tv'],
  },
  tabWidth: 2,
  trailingComma: 'all',
  useTabs: false,
}
