import { describe, expect, it } from 'vitest'

import en from '../../src/i18n/translations/en'
import es from '../../src/i18n/translations/es'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function collectLeafPaths(node: unknown, prefix = ''): string[] {
  if (!isRecord(node)) {
    return [prefix]
  }

  return Object.entries(node).flatMap(([key, value]) => {
    const nextPrefix = prefix ? `${prefix}.${key}` : key

    return collectLeafPaths(value, nextPrefix)
  })
}

describe('i18n resources parity', () => {
  it('keeps English and Spanish translation key shapes aligned', () => {
    const enLeafPaths = collectLeafPaths(en).toSorted()
    const esLeafPaths = collectLeafPaths(es).toSorted()

    expect(esLeafPaths).toEqual(enLeafPaths)
  })
})
