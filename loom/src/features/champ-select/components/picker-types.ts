import type { Perk, PerkPage, PerkStyle, RecommendedPage } from '@/core/lcu/parsers/perks'
import type { SummonerSpell } from '@/core/lcu/queries/summoner'

export interface ChampionOption {
  id: number
  name: string
}

export interface ChampionGridProps {
  // Arena's Valentía: its label, for the client's tile before the champions while there's more than one to pick
  bravery?: string
  // Champions shown greyed out, which can't be picked: banned, taken, not owned
  disabledIds?: ReadonlySet<number>
  // Settled, so an empty list means none to show rather than still loading
  isLoaded: boolean
  onPick: (championId: number) => void
  options: readonly ChampionOption[]
  value: number
}

export type ChampionSort = 'favorite' | 'mastery' | 'name'

export interface ChampionSortSheetProps {
  onApply: (sort: ChampionSort) => void
  onOpenChange: (open: boolean) => void
  open: boolean
  sort: ChampionSort
}

export interface InfoSheetProps {
  body: string
  onOpenChange: (open: boolean) => void
  open: boolean
  title: string
}

export interface RunePageEditorProps {
  onOpenChange: (open: boolean) => void
  onSaved: (page: PerkPage) => void
  open: boolean
  page: PerkPage
}

export interface RuneRecommenderProps {
  championId: number
  onApply: (page: RecommendedPage) => void
  onOpenChange: (open: boolean) => void
  open: boolean
  position: string
}

export interface RecommendedRunePageProps {
  page: RecommendedPage
  perks: ReadonlyMap<number, Perk>
  spells: SummonerSpell[]
  styles: readonly PerkStyle[]
}
