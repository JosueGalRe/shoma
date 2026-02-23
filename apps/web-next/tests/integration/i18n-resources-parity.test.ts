import { describe, expect, it } from 'bun:test'

import { resources } from '../../src/i18n/resources'

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
    const enLeafPaths = collectLeafPaths(resources.en.translation).sort()
    const esLeafPaths = collectLeafPaths(resources.es.translation).sort()

    expect(esLeafPaths).toEqual(enLeafPaths)
  })
})
