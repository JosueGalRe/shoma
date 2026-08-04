import { BanSlotView } from './ban-slot'
import { draftHeaderStyles } from './draft-header-styles'

import type { BanSlot } from '../champ-select-actions'
import type { ChampionSummary } from '@/core/http/ddragon'

export interface DraftHeaderProps {
  allyBans: BanSlot[]
  champions: ChampionSummary[]
  enemyBans: BanSlot[]
  isUrgent: boolean
  subtitle: string
  timerSeconds: number
}

export function DraftHeader({ allyBans, champions, enemyBans, isUrgent, subtitle, timerSeconds }: DraftHeaderProps) {
  const styles = draftHeaderStyles({ urgent: isUrgent })

  return (
    <header className={styles.root()}>
      <div className={styles.banRow()}>
        {allyBans.map((slot) => {
          return <BanSlotView champions={champions} key={slot.id} slot={slot} />
        })}
      </div>

      <div className={styles.center()}>
        <div className={styles.timer()} aria-live="polite">
          {timerSeconds}
        </div>

        <div className={styles.subtitle()}>{subtitle}</div>
      </div>

      <div className={styles.banRow()}>
        {enemyBans.map((slot) => {
          return <BanSlotView champions={champions} key={slot.id} slot={slot} />
        })}
      </div>
    </header>
  )
}
