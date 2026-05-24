import { beforeEach, describe, expect, test } from 'vitest'

import { SummonerId } from '../../src/core/types/branded'
import {
  selectSwiftplayConfigBySummonerId,
  selectSwiftplayErrors,
  selectSwiftplayIsValid,
  useSwiftplayStore,
  validateConfig,
} from '../../src/features/swiftplay/swiftplay-store'

beforeEach(() => {
  useSwiftplayStore.getState().reset()
})

describe('swiftplay store', () => {
  test('does not use persist middleware', () => {
    const useSwiftplayStoreWithPersist: typeof useSwiftplayStore & { persist?: unknown } = useSwiftplayStore
    expect(useSwiftplayStoreWithPersist.persist).toBeUndefined()
  })

  test('treats an empty config as invalid', () => {
    const { isValid, errors } = validateConfig(useSwiftplayStore.getState().myConfig)
    expect(errors).toEqual(['swiftplay.errors.bothOptionsRequired'])
    expect(isValid).toBe(false)
    expect(selectSwiftplayIsValid(useSwiftplayStore.getState())).toBe(false)
    expect(selectSwiftplayErrors(useSwiftplayStore.getState())).toEqual(['swiftplay.errors.bothOptionsRequired'])
  })

  test('requires both options to be fully configured', () => {
    configureOption(1, 1)

    let result = validateConfig(useSwiftplayStore.getState().myConfig)
    expect(result.isValid).toBe(false)
    expect(result.errors).toEqual(['swiftplay.errors.bothOptionsRequired'])

    configureOption(2, 2)

    result = validateConfig(useSwiftplayStore.getState().myConfig)
    expect(result.isValid).toBe(true)
    expect(result.errors).toEqual([])
  })

  test('updates the targeted option without changing the other one', () => {
    useSwiftplayStore.getState().setOption(1, 'championId', 3)

    expect(useSwiftplayStore.getState().myConfig.option1.championId).toBe(3)
    expect(useSwiftplayStore.getState().myConfig.option2.championId).toBeNull()
  })

  test('memoizes config selectors by summoner id', () => {
    const summonerId = SummonerId(1)
    expect(selectSwiftplayConfigBySummonerId(summonerId)).toBe(selectSwiftplayConfigBySummonerId(summonerId))
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
