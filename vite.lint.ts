import type { UserConfig } from 'vite-plus'

export const lintConfig: UserConfig['lint'] = {
  categories: {
    correctness: 'off',
    style: 'off',
    suspicious: 'off',
  },
  env: {
    browser: true,
    builtin: true,
    node: true,
  },
  jsPlugins: [],
  options: {
    typeAware: true,
    typeCheck: true,
  },
  overrides: [],
  plugins: [],
  rules: {},
}
