import { beforeEach, describe, expect, test } from 'bun:test'

import { useSwiftplayStore } from '../../src/features/swiftplay/swiftplay-store'

beforeEach(() => {
  useSwiftplayStore.getState().reset()
})

describe('swiftplay store', () => {
  test('treats an empty config as invalid', () => {
    expect(useSwiftplayStore.getState()).toMatchObject({
      errors: ['swiftplay.errors.bothOptionsRequired'],
      isValid: false,
    })
  })

  test('requires both options to be fully configured', () => {
    configureOption(1, 1)

    expect(useSwiftplayStore.getState().isValid).toBe(false)
    expect(useSwiftplayStore.getState().errors).toEqual(['swiftplay.errors.bothOptionsRequired'])

    configureOption(2, 2)

    expect(useSwiftplayStore.getState().isValid).toBe(true)
    expect(useSwiftplayStore.getState().errors).toEqual([])
  })

  test('updates the targeted option without changing the other one', () => {
    useSwiftplayStore.getState().setOption(1, 'championId', 3)

    expect(useSwiftplayStore.getState().myConfig.option1.championId).toBe(3)
    expect(useSwiftplayStore.getState().myConfig.option2.championId).toBeNull()
  })
})

function configureOption(optionIndex: 1 | 2, championId: number): void {
  useSwiftplayStore.getState().setOption(optionIndex, 'championId', championId)
  useSwiftplayStore.getState().setOption(optionIndex, 'position', 'top')
  useSwiftplayStore.getState().setOption(optionIndex, 'runeId', 8000)
  useSwiftplayStore.getState().setOption(optionIndex, 'spell1Id', 4)
  useSwiftplayStore.getState().setOption(optionIndex, 'spell2Id', 14)
  useSwiftplayStore.getState().setOption(optionIndex, 'skinId', 0)
}
