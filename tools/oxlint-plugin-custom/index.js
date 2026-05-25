import noDuplicateImports from './rules/no-duplicate-imports.js'

const rules = {
  meta: {
    name: 'custom-imports',
  },
  rules: {
    'no-duplicate-imports': noDuplicateImports,
  },
}

export default rules
