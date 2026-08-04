import { Ban } from 'lucide-react'

import { resolveChampionIcon } from '@/lib/asset-resolver'

import { banSlotStyles } from './ban-slot-styles'

import type { BanSlot } from '../champ-select-actions'
import type { ChampionSummary } from '@/core/http/ddragon'

export interface BanSlotViewProps {
  champions: ChampionSummary[]
  slot: BanSlot
}

export function BanSlotView({ champions, slot }: BanSlotViewProps) {
  const styles = banSlotStyles({ pending: slot.isPending })

  if (slot.isNoBan) {
    return (
      <div className={styles.root()} aria-label="No ban">
        <Ban className={styles.noBanIcon()} />
      </div>
    )
  }

  if (slot.championId === null) {
    return <div className={styles.root()} aria-hidden="true" />
  }

  return (
    <div className={styles.root()}>
      <img alt="" className={styles.image()} loading="lazy" src={resolveChampionIcon(slot.championId, champions)} />
    </div>
  )
}
