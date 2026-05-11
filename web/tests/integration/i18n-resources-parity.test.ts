import { describe, expect, it } from 'bun:test'

import en from '../../src/i18n/translations/en'
import es from '../../src/i18n/translations/es'

function collectLeafPaths(node: unknown, prefix = ''): string[] {
  if (typeof node !== 'object' || node === null) {
    return [prefix]
  }

  const record = node as Record<string, unknown>
  return Object.entries(record).flatMap(([key, value]) => {
    const nextPrefix = prefix ? `${prefix}.${key}` : key
    return collectLeafPaths(value, nextPrefix)
  })
}

describe('i18n resources parity', () => {
  it('keeps English and Spanish translation key shapes aligned', () => {
    const enLeafPaths = collectLeafPaths(en).sort()
    const esLeafPaths = collectLeafPaths(es).sort()

    expect(esLeafPaths).toEqual(enLeafPaths)
  })
})
