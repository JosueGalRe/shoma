import { create } from 'zustand'

import type { ChampionId, RuneId, SpellId, SummonerId } from '@/core/types/branded'

export type SwiftplayOption = {
  championId: ChampionId | null
  position: string | null
  runeId: RuneId | null
  spell1Id: SpellId | null
  spell2Id: SpellId | null
  skinId: number | null
}

export type SwiftplayConfig = {
  option1: SwiftplayOption
  option2: SwiftplayOption
}

export type SwiftplayStoreState = {
  configs: Partial<Record<SummonerId, SwiftplayConfig>> // key = summonerId
  myConfig: SwiftplayConfig
}

// @knip
export type SwiftplayStoreActions = {
  setOption: <Field extends keyof SwiftplayOption>(optionIndex: 1 | 2, field: Field, value: SwiftplayOption[Field]) => void
  validate: () => void
  reset: () => void
}

export type SwiftplayStore = SwiftplayStoreState & SwiftplayStoreActions

type SwiftplayStoreSelector<T> = (state: SwiftplayStoreState) => T

const swiftplayConfigSelectorCache = new Map<SummonerId, SwiftplayStoreSelector<SwiftplayConfig | undefined>>()

const emptyOption: SwiftplayOption = {
  championId: null,
  position: null,
  runeId: null,
  spell1Id: null,
  spell2Id: null,
  skinId: null,
}

export const selectSwiftplayConfigs: SwiftplayStoreSelector<SwiftplayStoreState['configs']> = (state) => state.configs

export const selectSwiftplayMyConfig: SwiftplayStoreSelector<SwiftplayConfig> = (state) => state.myConfig

export const selectSwiftplayOption1: SwiftplayStoreSelector<SwiftplayOption> = (state) => state.myConfig.option1

export const selectSwiftplayOption2: SwiftplayStoreSelector<SwiftplayOption> = (state) => state.myConfig.option2

function getValidationResult(config: SwiftplayConfig): { errors: string[]; isValid: boolean } {
  const errors: string[] = []

  const isOption1Complete = isOptionComplete(config.option1)
  const isOption2Complete = isOptionComplete(config.option2)

  if (!isOption1Complete || !isOption2Complete) {
    errors.push('swiftplay.errors.bothOptionsRequired')
  }

  const result = {
    errors,
    isValid: isOption1Complete && isOption2Complete,
  }
  return result
}

export function validateConfig(config: SwiftplayConfig): { isValid: boolean; errors: string[] } {
  return getValidationResult(config)
}

function isOptionComplete(option: SwiftplayOption): boolean {
  return (
    option.championId !== null &&
    option.position !== null &&
    option.runeId !== null &&
    option.spell1Id !== null &&
    option.spell2Id !== null &&
    option.skinId !== null
  )
}

// @knip
export const initialSwiftplayStoreState: SwiftplayStoreState = {
  configs: {},
  myConfig: {
    option1: { ...emptyOption },
    option2: { ...emptyOption },
  },
}

export const useSwiftplayStore = create<SwiftplayStore>()((set) => ({
  ...initialSwiftplayStoreState,
  setOption(optionIndex, field, value) {
    set((state) => {
      const optionKey = optionIndex === 1 ? 'option1' : 'option2'
      const newConfig: SwiftplayConfig = {
        ...state.myConfig,
        [optionKey]: {
          ...state.myConfig[optionKey],
          [field]: value,
        },
      }

      return {
        myConfig: newConfig,
      }
    })
  },
  validate() {
  },
  reset() {
    set({ ...initialSwiftplayStoreState })
  },
}))

export const selectSwiftplayIsValid: SwiftplayStoreSelector<boolean> = (state) => getValidationResult(state.myConfig).isValid

export const selectSwiftplayErrors: SwiftplayStoreSelector<string[]> = (state) => getValidationResult(state.myConfig).errors

export function selectSwiftplayConfigBySummonerId(summonerId: SummonerId): SwiftplayStoreSelector<SwiftplayConfig | undefined> {
  const cachedSelector = swiftplayConfigSelectorCache.get(summonerId)

  if (cachedSelector) {
    return cachedSelector
  }

  const selector: SwiftplayStoreSelector<SwiftplayConfig | undefined> = (state) => state.configs[summonerId]
  swiftplayConfigSelectorCache.set(summonerId, selector)
  return selector
}
