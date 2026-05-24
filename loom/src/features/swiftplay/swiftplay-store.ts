import { create } from 'zustand'

import type { SummonerId } from '@/core/types/branded'

import {
  BOTH_SWIFTPLAY_OPTIONS_REQUIRED_ERRORS,
  EMPTY_SWIFTPLAY_ERRORS,
  isOptionComplete,
  validateConfig as validateSwiftplayConfig,
} from './swiftplay-store-utils'
import type { SwiftplayConfig } from './swiftplay-store-types';
import type { SwiftplayOption } from './swiftplay-store-types';
import type { SwiftplayStore } from './swiftplay-store-types';
import type { SwiftplayStoreSelector } from './swiftplay-store-types';
import type { SwiftplayStoreState } from './swiftplay-store-types';

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

export function selectSwiftplayConfigs(state: SwiftplayStoreState): SwiftplayStoreState['configs'] {
  return state.configs
}

export function selectSwiftplayMyConfig(state: SwiftplayStoreState): SwiftplayConfig {
  return state.myConfig
}

export function selectSwiftplayOption1(state: SwiftplayStoreState): SwiftplayOption {
  return state.myConfig.option1
}

export function selectSwiftplayOption2(state: SwiftplayStoreState): SwiftplayOption {
  return state.myConfig.option2
}

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

export function selectSwiftplayIsValid(state: SwiftplayStoreState): boolean {
  return isOptionComplete(state.myConfig.option1) && isOptionComplete(state.myConfig.option2)
}

export function selectSwiftplayErrors(state: SwiftplayStoreState): string[] {
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

  function selector(state: SwiftplayStoreState): SwiftplayConfig | undefined {
    return state.configs[summonerId]
  }

  swiftplayConfigSelectorCache.set(summonerId, selector)
  return selector
}
