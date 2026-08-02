import { useState } from 'react'

import { useTranslation } from 'react-i18next'

import { useChampSelectStore } from '../champ-select-store'

import { ChampionPickerAram } from './champion-picker-aram'
import { ChampionPickerClassic } from './champion-picker-classic'
import { ChampionPickerFilters } from './champion-picker-filters'

import type { ChampionSortOrder } from './champion-picker-utils'

export function ChampionPicker() {
  const { t } = useTranslation()
  const isAram = useChampSelectStore((state) => {
    return state.isAram
  })
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
      <ChampionPickerAram query={query} sortOrder={sortOrder} activeRoleFilter={activeRoleFilter} filters={filters} t={t} />
    )
  }

  return (
    <ChampionPickerClassic query={query} sortOrder={sortOrder} activeRoleFilter={activeRoleFilter} filters={filters} t={t} />
  )
}
