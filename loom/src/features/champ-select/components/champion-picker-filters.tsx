import { Input } from '@/components/ui/input'

import { championPickerFilterStyles } from './champion-picker-styles'

import type { ChampionPickerFiltersProps } from './champion-picker-filters-types'

const ROLE_FILTERS = ['Assassin', 'Fighter', 'Mage', 'Marksman', 'Support', 'Tank'] as const

export function ChampionPickerFilters({
  query,
  sortOrder,
  activeRoleFilter,
  onQueryChange,
  onSortOrderChange,
  onRoleFilterChange,
  t,
}: ChampionPickerFiltersProps) {
  const filterStyles = championPickerFilterStyles()

  return (
    <div className={filterStyles.root()}>
      <Input
        aria-label={t('champSelect.searchChampions', { defaultValue: 'Search champions' })}
        className={filterStyles.input()}
        onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
          return onQueryChange(event.target.value)
        }}
        placeholder={t('champSelect.searchChampions', { defaultValue: 'Search champions' })}
        value={query}
      />

      <div className={filterStyles.list()}>
        <button
          className={championPickerFilterStyles({ active: sortOrder === 'name-asc' }).button()}
          onClick={() => {
            return onSortOrderChange('name-asc')
          }}
          type="button"
        >
          {t('champSelect.sortNameAsc', { defaultValue: 'Name (A-Z)' })}
        </button>

        <button
          className={championPickerFilterStyles({ active: sortOrder === 'name-desc' }).button()}
          onClick={() => {
            return onSortOrderChange('name-desc')
          }}
          type="button"
        >
          {t('champSelect.sortNameDesc', { defaultValue: 'Name (Z-A)' })}
        </button>

        <div className={filterStyles.divider()} />

        {ROLE_FILTERS.map((role) => {
          return (
            <button
              className={championPickerFilterStyles({ active: activeRoleFilter === role }).button()}
              key={role}
              onClick={() => {
                return onRoleFilterChange(activeRoleFilter === role ? null : role)
              }}
              type="button"
            >
              {role}
            </button>
          )
        })}
      </div>
    </div>
  )
}
