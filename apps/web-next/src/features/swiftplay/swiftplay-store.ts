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

export type SwiftplayStoreActions = {
  setOption: <Field extends keyof SwiftplayOption>(optionIndex: 1 | 2, field: Field, value: SwiftplayOption[Field]) => void
  validate: () => void
  reset: () => void
}

export type SwiftplayStore = SwiftplayStoreState & SwiftplayStoreActions

const emptyOption: SwiftplayOption = {
  championId: null,
  position: null,
  runeId: null,
  spell1Id: null,
  spell2Id: null,
  skinId: null,
}

export function validateConfig(config: SwiftplayConfig): { isValid: boolean; errors: string[] } {
  const errors: string[] = []

  const isOption1Complete = isOptionComplete(config.option1)
  const isOption2Complete = isOptionComplete(config.option2)

  if (!isOption1Complete || !isOption2Complete) {
    errors.push('swiftplay.errors.bothOptionsRequired')
  }

  return {
    isValid: isOption1Complete && isOption2Complete,
    errors,
  }
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

export function selectSwiftplayIsValid(state: SwiftplayStoreState): boolean {
  return validateConfig(state.myConfig).isValid
}

export function selectSwiftplayErrors(state: SwiftplayStoreState): string[] {
  return validateConfig(state.myConfig).errors
}
