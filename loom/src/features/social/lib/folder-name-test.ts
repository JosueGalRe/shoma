import { describe, expect, test } from 'vitest'

import { validateFolderName } from './folder-name'

const rules = { reserved: ['Riot Mobile', 'Offline', 'Other Servers'], taken: ['**Default', 'cheny', 'General'] }

describe('validateFolderName', () => {
  test('takes a new name', () => {
    expect(validateFolderName('Duo', rules)).toBeNull()
  })

  test("rejects a folder's name or General's, whatever the case and the spaces around", () => {
    expect(validateFolderName('  CHENY ', rules)).toBe('exists')
    expect(validateFolderName('general', rules)).toBe('exists')
  })

  test('rejects the groups the client makes itself', () => {
    expect(validateFolderName('riot mobile', rules)).toBe('reserved')
    expect(validateFolderName('OFFLINE', rules)).toBe('reserved')
  })
})
