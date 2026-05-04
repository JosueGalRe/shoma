import { beforeEach, describe, expect, test } from 'bun:test'

import { useSwiftplayStore } from '../../src/features/swiftplay/swiftplay-store'

beforeEach(() => {
  useSwiftplayStore.getState().reset()
})

describe('swiftplay store', () => {
  test('treats an empty config as invalid', () => {
    expect(useSwiftplayStore.getState()).toMatchObject({
      errors: ['swiftplay.errors.atLeastOneOptionRequired'],
      isValid: false,
    })
  })

  test('accepts option 1 when champion and position are set', () => {
    useSwiftplayStore.getState().setOption(1, 'championId', 1)
    useSwiftplayStore.getState().setOption(1, 'position', 'Top')

    expect(useSwiftplayStore.getState().isValid).toBe(true)
    expect(useSwiftplayStore.getState().errors).toEqual([])
  })

  test('accepts option 2 when champion and position are set', () => {
    useSwiftplayStore.getState().setOption(2, 'championId', 2)
    useSwiftplayStore.getState().setOption(2, 'position', 'Mid')

    expect(useSwiftplayStore.getState().isValid).toBe(true)
    expect(useSwiftplayStore.getState().errors).toEqual([])
  })

  test('updates the targeted option without changing the other one', () => {
    useSwiftplayStore.getState().setOption(1, 'championId', 3)

    expect(useSwiftplayStore.getState().myConfig.option1.championId).toBe(3)
    expect(useSwiftplayStore.getState().myConfig.option2.championId).toBeNull()
  })
})
