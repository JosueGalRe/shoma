import type { ReactNode } from 'react'

import type { Perk, PerkPage, PerkStyle, RecommendedPage } from '@/core/lcu/parsers/perks'
import type { SummonerSpell } from '@/core/lcu/queries/summoner'
import type { RoleSlot } from '@/features/lobby/utils/compute-role-preferences'

export interface QuickPlayScreenProps {
  children: ReactNode
  confirmDisabled: boolean
  hasError: boolean
  onConfirm: () => void
  // Under the title, as Select Position names the slot it fills
  subtitle?: string
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

export interface QuickPlaySpellPickerProps extends QuickPlayPickerProps {
  // The key a pick lands on first: D, or F
  slot: RoleSlot
}

export interface QuickPlaySpellOptionProps {
  // The line under the name while not picked: the level a locked spell unlocks at
  caption: string | null
  infoLabel: string
  locked: boolean
  onInfoClick: () => void
  onPick: () => void
  // The key it is picked for, null while not picked
  slot: RoleSlot | null
  spell: SummonerSpell
  spellIcon: string
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
