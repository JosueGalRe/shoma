import { create } from 'zustand'

import type { SummonerId } from '@/core/types/branded'

import {
  BOTH_SWIFTPLAY_OPTIONS_REQUIRED_ERRORS,
  EMPTY_SWIFTPLAY_ERRORS,
  isOptionComplete,
  validateConfig as validateSwiftplayConfig,
} from './swiftplay-store-utils'
import type {
  SwiftplayConfig,
  SwiftplayOption,
  SwiftplayStore,
  SwiftplayStoreSelector,
  SwiftplayStoreState,
} from './swiftplay-store-types'

export type { SwiftplayConfig, SwiftplayOption, SwiftplayStore, SwiftplayStoreActions, SwiftplayStoreState } from './swiftplay-store-types'

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

export function validateConfig(config: SwiftplayConfig): { isValid: boolean; errors: string[] } {
  return validateSwiftplayConfig(config)
}

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
  validate() {},
  reset() {
    set({ ...initialSwiftplayStoreState })
  },
}))

export const selectSwiftplayIsValid: SwiftplayStoreSelector<boolean> = (state) => {
  return isOptionComplete(state.myConfig.option1) && isOptionComplete(state.myConfig.option2)
}

export const selectSwiftplayErrors: SwiftplayStoreSelector<string[]> = (state) => {
  const isOption1Complete = isOptionComplete(state.myConfig.option1)
  const isOption2Complete = isOptionComplete(state.myConfig.option2)

  if (!isOption1Complete || !isOption2Complete) {
    return BOTH_SWIFTPLAY_OPTIONS_REQUIRED_ERRORS
  }

  return EMPTY_SWIFTPLAY_ERRORS
}

export function selectSwiftplayConfigBySummonerId(summonerId: SummonerId): SwiftplayStoreSelector<SwiftplayConfig | undefined> {
  const cachedSelector = swiftplayConfigSelectorCache.get(summonerId)

  if (cachedSelector) {
    return cachedSelector
  }

  const selector: SwiftplayStoreSelector<SwiftplayConfig | undefined> = (state) => state.configs[summonerId]
  swiftplayConfigSelectorCache.set(summonerId, selector)
  return selector
}
