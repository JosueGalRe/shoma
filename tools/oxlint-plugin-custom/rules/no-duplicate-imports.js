const defaultOptions = {
  considerQueryString: false,
  ignoreDeclareModules: false,
  includeExports: false,
  preferInline: false,
}

function isInsideDeclareModule(node) {
  let current = node.parent

  while (current) {
    if (current.type === 'TSModuleDeclaration' && current.declare === true) {
      return true
    }

    current = current.parent
  }

  return false
}

function getImportName(imported) {
  if (!imported) {
    return undefined
  }

  if (imported.type === 'Identifier') {
    return imported.name
  }

  // Por si Oxlint/ESTree entrega Literal para imports raros:
  if ('value' in imported && typeof imported.value === 'string') {
    return imported.value
  }

  return undefined
}

function ensureRecord(map, source) {
  if (!map.has(source)) {
    map.set(source, { type: [], value: [] })
  }

  return map.get(source)
}

const rule = {
  create(context) {
    const options = {
      ...defaultOptions,
      ...context.options?.[0],
    }

    const imports = new Map()
    const exports = new Map()

    return {
      ExportNamedDeclaration(node) {
        if (!options.includeExports) {
          return
        }

        if (!node.source) {
          return
        }

        if (options.ignoreDeclareModules && isInsideDeclareModule(node)) {
          return
        }

        const source = node.source.value

        if (typeof source !== 'string') {
          return
        }

        const kind = node.exportKind === 'type' ? 'type' : 'value'
        const record = ensureRecord(exports, source)

        record[kind].push(node)

        if (record[kind].length > 1) {
          context.report({
            data: { source },
            messageId: kind === 'type' ? 'duplicateTypeExport' : 'duplicateExport',
            node,
          })
        }
      },

      ImportDeclaration(node) {
        if (options.ignoreDeclareModules && isInsideDeclareModule(node)) {
          return
        }

        const rawSource = node.source.value

        if (typeof rawSource !== 'string') {
          return
        }

        const source = options.considerQueryString ? rawSource : rawSource.split('?')[0]

        const kind = !options.preferInline && node.importKind === 'type' ? 'type' : 'value'

        const record = ensureRecord(imports, source)

        record[kind].push(node)

        if (record[kind].length <= 1) {
          return
        }

        context.report({
          data: { source },
          fix(fixer) {
            const declarations = record[kind]

            // Tu fixer original solo fusiona ImportSpecifier.
            // Evitamos romper imports default, namespace o side-effect.
            const hasUnsafeSpecifier = declarations.some((declaration) => {
              return declaration.specifiers.some((specifier) => {
                return specifier.type !== 'ImportSpecifier'
              })
            })

            if (hasUnsafeSpecifier) {
              return null
            }

            const uniqueNames = new Map()

            for (const declaration of declarations) {
              for (const specifier of declaration.specifiers) {
                const local = specifier.local?.name
                const imported = getImportName(specifier.imported)

                if (local || imported) {
                  const isTypeOnly = declaration.importKind === 'type' || specifier.importKind === 'type'

                  const typePrefix = kind === 'value' && isTypeOnly ? 'type ' : ''

                  const text = imported === local ? `${typePrefix}${local}` : `${typePrefix}${imported} as ${local}`

                  uniqueNames.set(local, text)
                }
              }
            }

            if (uniqueNames.size === 0) {
              return null
            }

            const importClause = kind === 'type' ? 'import type {' : 'import {'
            const names = [...uniqueNames.values()].join(', ')
            const replacement = `${importClause} ${names} } from '${source}';`

            return declarations.map((declaration, index) => {
              return index === 0 ? fixer.replaceText(declaration, replacement) : fixer.remove(declaration)
            })
          },
          messageId: kind === 'type' ? 'duplicateTypeImport' : 'duplicateImport',
          node,
        })
      },
    }
  },

  meta: {
    docs: {
      description: 'Disallow duplicate imports',
      recommended: true,
    },
    fixable: 'code',
    messages: {
      duplicateExport: 'Duplicate export from "{{source}}".',
      duplicateImport: 'Duplicate import from "{{source}}".',
      duplicateTypeExport: 'Duplicate export type from "{{source}}".',
      duplicateTypeImport: 'Duplicate import type from "{{source}}".',
    },
    schema: [
      {
        additionalProperties: false,
        properties: {
          considerQueryString: { type: 'boolean' },
          ignoreDeclareModules: { type: 'boolean' },
          includeExports: { type: 'boolean' },
          preferInline: { type: 'boolean' },
        },
        type: 'object',
      },
    ],
    type: 'problem',
  },
}

export default rule
