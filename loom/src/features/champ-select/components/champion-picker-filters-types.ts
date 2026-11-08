import type { ChampionSortOrder } from './champion-picker-utils'
import type { TFunction } from 'i18next'

export interface ChampionPickerFiltersProps {
  query: string
  sortOrder: ChampionSortOrder
  activeRoleFilter: string | null
  onQueryChange: (query: string) => void
  onSortOrderChange: (sortOrder: ChampionSortOrder) => void
  onRoleFilterChange: (role: string | null) => void
  t: TFunction
}
