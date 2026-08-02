import type { ChampionSortOrder } from './champion-picker-utils'

export interface ChampionPickerFiltersProps {
  query: string
  sortOrder: ChampionSortOrder
  activeRoleFilter: string | null
  onQueryChange: (query: string) => void
  onSortOrderChange: (sortOrder: ChampionSortOrder) => void
  onRoleFilterChange: (role: string | null) => void
  t: (key: string, options?: { defaultValue: string }) => string
}
