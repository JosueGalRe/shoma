import { describe, expect, test } from 'vitest'

import { assignSpell } from './quick-play-screen-utils'

describe('assignSpell', () => {
  test('lands on the key being picked', () => {
    expect(assignSpell([0, 0], 'first', 4)).toEqual([4, 0])
    expect(assignSpell([4, 7], 'second', 14)).toEqual([4, 14])
  })

  test("the other key's spell swaps keys", () => {
    expect(assignSpell([4, 7], 'first', 7)).toEqual([7, 4])
    expect(assignSpell([4, 0], 'second', 4)).toEqual([0, 4])
  })

  test('the spell already on the key stays', () => {
    expect(assignSpell([4, 7], 'first', 4)).toEqual([4, 7])
  })
})
