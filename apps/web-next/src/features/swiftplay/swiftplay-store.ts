import { create } from 'zustand'

export type SwiftplayOption = {
  championId: number | null
  position: string | null
  runeId: number | null
  spell1Id: number | null
  spell2Id: number | null
  skinId: number | null
}

export type SwiftplayConfig = {
  option1: SwiftplayOption
  option2: SwiftplayOption
}

export type SwiftplayStoreState = {
  configs: Record<string, SwiftplayConfig> // key = summonerId
  myConfig: SwiftplayConfig
  isValid: boolean
  errors: string[]
}

export type SwiftplayStoreActions = {
  setOption: (optionIndex: 1 | 2, field: keyof SwiftplayOption, value: unknown) => void
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

function validateConfig(config: SwiftplayConfig): { isValid: boolean; errors: string[] } {
  const errors: string[] = []

  const isOption1Complete = config.option1.championId !== null && config.option1.position !== null
  const isOption2Complete = config.option2.championId !== null && config.option2.position !== null

  if (!isOption1Complete && !isOption2Complete) {
    errors.push('swiftplay.errors.atLeastOneOptionRequired')
  }

  return {
    isValid: isOption1Complete || isOption2Complete,
    errors,
  }
}

const initialValidation = validateConfig({
  option1: { ...emptyOption },
  option2: { ...emptyOption },
})

export const initialSwiftplayStoreState: SwiftplayStoreState = {
  configs: {},
  myConfig: {
    option1: { ...emptyOption },
    option2: { ...emptyOption },
  },
  isValid: initialValidation.isValid,
  errors: initialValidation.errors,
}

export const useSwiftplayStore = create<SwiftplayStore>()((set) => ({
  ...initialSwiftplayStoreState,
  setOption(optionIndex, field, value) {
    set((state) => {
      const optionKey = optionIndex === 1 ? 'option1' : 'option2'
      const newConfig = {
        ...state.myConfig,
        [optionKey]: {
          ...state.myConfig[optionKey],
          [field]: value,
        },
      }
      
      const validation = validateConfig(newConfig)
      
      return {
        myConfig: newConfig,
        isValid: validation.isValid,
        errors: validation.errors,
      }
    })
  },
  validate() {
    set((state) => {
      const validation = validateConfig(state.myConfig)
      return {
        isValid: validation.isValid,
        errors: validation.errors,
      }
    })
  },
  reset() {
    set({ ...initialSwiftplayStoreState })
  },
}))
