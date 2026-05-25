import type { ChampionId, RuneId, SpellId } from '@/core/types/branded';


import type { SummonerId } from '@/core/types/branded'

export interface SwiftplayOption {
  championId: ChampionId | null
  position: string | null
  runeId: RuneId | null
  spell1Id: SpellId | null
  spell2Id: SpellId | null
  skinId: number | null
}

export interface SwiftplayConfig {
  option1: SwiftplayOption
  option2: SwiftplayOption
}

export interface SwiftplayStoreState {
  configs: Partial<Record<SummonerId, SwiftplayConfig>>
  myConfig: SwiftplayConfig
}

export interface SwiftplayStoreActions {
  setOption: <Field extends keyof SwiftplayOption>(optionIndex: 1 | 2, field: Field, value: SwiftplayOption[Field]) => void
  validate: () => void
  reset: () => void
}

export type SwiftplayStore = SwiftplayStoreState & SwiftplayStoreActions

export type SwiftplayStoreSelector<T> = (state: SwiftplayStoreState) => T
