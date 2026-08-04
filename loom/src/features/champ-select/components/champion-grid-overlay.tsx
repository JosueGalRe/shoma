import { useState } from 'react'

import { X } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { resolveChampionIcon } from '@/lib/asset-resolver'

import { championGridOverlayStyles } from './champion-grid-overlay-styles'
import { ChampionPickerFilters } from './champion-picker-filters'
import { filterChampions } from './champion-picker-utils'

import type { ChampionSortOrder } from './champion-picker-utils'
import type { ChampionSummary } from '@/core/http/ddragon'
import type { ChampionId as ChampionIdType } from '@/core/types/branded'

export interface ChampionGridOverlayProps {
  champions: ChampionSummary[]
  disabledChampionIds: ReadonlySet<ChampionIdType>
  isOpen: boolean
  onClose: () => void
  onSelectChampion: (championId: ChampionIdType) => void
  selectedChampionId: ChampionIdType | null
  title: string
}

export function ChampionGridOverlay({
  champions,
  disabledChampionIds,
  isOpen,
  onClose,
  onSelectChampion,
  selectedChampionId,
  title,
}: ChampionGridOverlayProps) {
  const { t } = useTranslation()
  const [query, setQuery] = useState('')
  const [sortOrder, setSortOrder] = useState<ChampionSortOrder>('name-asc')
  const [activeRoleFilter, setActiveRoleFilter] = useState<string | null>(null)
  const styles = championGridOverlayStyles()

  if (!isOpen) {
    return null
  }

  const visibleChampions = filterChampions({ activeRoleFilter, champions, query, sortOrder })

  return (
    <div aria-label={title} aria-modal="true" className={styles.root()} role="dialog">
      <div className={styles.header()}>
        <h2 className={styles.title()}>{title}</h2>

        <button aria-label={t('common.close')} className={styles.closeButton()} onClick={onClose} type="button">
          <X className={styles.closeIcon()} />
        </button>
      </div>

      <ChampionPickerFilters
        query={query}
        sortOrder={sortOrder}
        activeRoleFilter={activeRoleFilter}
        onQueryChange={setQuery}
        onSortOrderChange={setSortOrder}
        onRoleFilterChange={setActiveRoleFilter}
        t={t}
      />

      <div className={styles.gridWrap()}>
        <div className={styles.grid()}>
          {visibleChampions.map((champion) => {
            const isDisabled = disabledChampionIds.has(champion.id)
            const isSelected = selectedChampionId === champion.id

            return (
              <button
                aria-pressed={isSelected}
                className={styles.card({ disabled: isDisabled, selected: isSelected })}
                disabled={isDisabled}
                key={champion.id}
                onClick={() => {
                  onSelectChampion(champion.id)
                }}
                type="button"
              >
                <img alt="" className={styles.cardImage()} loading="lazy" src={resolveChampionIcon(champion.id, champions)} />

                <span className={styles.cardName()}>{champion.name}</span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
