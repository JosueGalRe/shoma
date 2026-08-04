import { useState } from 'react'

import { useTranslation } from 'react-i18next'

import { ChampionPickerAram } from './champion-picker-aram'
import { ChampionPickerClassic } from './champion-picker-classic'
import { ChampionPickerFilters } from './champion-picker-filters'

import type { ChampionPickerViewProps } from './champion-picker-branch-types'
import type { ChampionSortOrder } from './champion-picker-utils'

export interface ChampionPickerProps extends ChampionPickerViewProps {
  isAram: boolean
}

export function ChampionPicker({ isAram, ...viewProps }: ChampionPickerProps) {
  const { t } = useTranslation()
  const [query, setQuery] = useState('')
  const [sortOrder, setSortOrder] = useState<ChampionSortOrder>('name-asc')
  const [activeRoleFilter, setActiveRoleFilter] = useState<string | null>(null)

  const filters = (
    <ChampionPickerFilters
      query={query}
      sortOrder={sortOrder}
      activeRoleFilter={activeRoleFilter}
      onQueryChange={setQuery}
      onSortOrderChange={setSortOrder}
      onRoleFilterChange={setActiveRoleFilter}
      t={t}
    />
  )

  if (isAram) {
    return (
      <ChampionPickerAram
        activeRoleFilter={activeRoleFilter}
        filters={filters}
        query={query}
        sortOrder={sortOrder}
        t={t}
        view={viewProps}
      />
    )
  }

  return (
    <ChampionPickerClassic
      activeRoleFilter={activeRoleFilter}
      filters={filters}
      query={query}
      sortOrder={sortOrder}
      t={t}
      view={viewProps}
    />
  )
}
