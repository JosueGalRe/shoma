import type { ReactNode } from 'react'

import type { Perk, PerkPage, PerkStyle, RecommendedPage } from '@/core/lcu/parsers/perks'
import type { SummonerSpell } from '@/core/lcu/queries/summoner'

export interface QuickPlayScreenProps {
  children: ReactNode
  confirmDisabled: boolean
  hasError: boolean
  onConfirm: () => void
  title: string
}

// Which of the two options a picker edits, 0 or 1
export interface QuickPlayPickerProps {
  option: number
}

export interface QuickPlayChampionGridProps {
  championId: number
  onPick: (championId: number) => void
  queueId: number | null
  summonerId: number | null
}

export interface QuickPlaySkinGridProps {
  championId: number
  onPick: (skinId: number) => void
  skinId: number
  summonerId: number | null
}

export interface QuickPlayInfoSheetProps {
  body: string
  onOpenChange: (open: boolean) => void
  open: boolean
  title: string
}

export type ChampionSort = 'favorite' | 'mastery' | 'name'

export interface QuickPlaySortSheetProps {
  onApply: (sort: ChampionSort) => void
  onOpenChange: (open: boolean) => void
  open: boolean
  sort: ChampionSort
}

export interface QuickPlayRuneEditorProps {
  onOpenChange: (open: boolean) => void
  onSaved: (page: PerkPage) => void
  open: boolean
  page: PerkPage
}

export interface QuickPlayRecommenderProps {
  championId: number
  onApply: (page: RecommendedPage) => void
  onOpenChange: (open: boolean) => void
  open: boolean
  position: string
}

export interface QuickPlayRecommendedPageProps {
  page: RecommendedPage
  perks: ReadonlyMap<number, Perk>
  spells: SummonerSpell[]
  styles: readonly PerkStyle[]
}
