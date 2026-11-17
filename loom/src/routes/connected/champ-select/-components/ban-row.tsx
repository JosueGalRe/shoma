import { create, props } from '@stylexjs/stylex'
import { useTranslation } from 'react-i18next'

import { readBanSlots } from '@/features/champ-select'
import { getChampionName } from '@/lib/asset-resolver'

import { BanRowSlot } from './ban-row-slot'

import type { BanRowProps } from './champ-select-screen-types'

// Both teams' bans in one row over the grid, the team's at the left and the enemy's at the right, as the client's top
// Bar has them. It stays from planning to the lock in, so the grid never moves; the enemy's fill in once revealed
export function BanRow({ champSelect }: BanRowProps) {
  const { t } = useTranslation()
  const allySlots = readBanSlots(champSelect.actions, true)
  const enemySlots = readBanSlots(champSelect.actions, false)

  if (allySlots.length === 0 && enemySlots.length === 0) {
    return null
  }

  function renderTeam(isAlly: boolean) {
    return (
      <div
        aria-label={t(isAlly ? 'champSelect.yourTeamBans' : 'champSelect.enemyTeamBans')}
        role="group"
        {...props(styles.team)}
      >
        {(isAlly ? allySlots : enemySlots).map((slot) => {
          return (
            <BanRowSlot
              key={slot.id}
              championId={slot.championId}
              isAlly={isAlly}
              name={slot.championId ? (getChampionName(slot.championId, champSelect.champions) ?? '') : ''}
            />
          )
        })}
      </div>
    )
  }

  return (
    <div {...props(styles.row)}>
      {renderTeam(true)}

      {renderTeam(false)}
    </div>
  )
}

const styles = create({
  // 16 to the search under it, half the body's gap
  row: {
    display: 'flex',
    flexShrink: 0,
    gap: 16,
    justifyContent: 'space-between',
    marginBlockEnd: -16,
  },
  team: {
    display: 'flex',
    gap: 4,
    minWidth: 0,
  },
})
