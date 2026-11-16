import { ScrollArea } from '@shoma/ui/scroll-area'
import { text } from '@shoma/ui/text'
import { color } from '@shoma/ui/tokens/color.stylex'
import { create, props } from '@stylexjs/stylex'
import { useTranslation } from 'react-i18next'

import { readBanSlots } from '@/features/champ-select'
import { getChampionName } from '@/lib/asset-resolver'

import { BannedChampion } from './banned-champion'

import type { BansPanelProps } from './champ-select-screen-types'
import type { BanSlot } from '@/features/champ-select'

// Figma "Waiting for other players" and "Bans locked in": the team's bans while the rest ban, and both teams' once
// The client reveals them
export function BansPanel({ champSelect, stage }: BansPanelProps) {
  const { t } = useTranslation()

  function renderBans(slots: BanSlot[]) {
    return (
      <div {...props(styles.bans)}>
        {slots.map((slot) => {
          return (
            <BannedChampion
              key={slot.id}
              championId={slot.championId}
              name={slot.championId ? (getChampionName(slot.championId, champSelect.champions) ?? '') : ''}
            />
          )
        })}
      </div>
    )
  }

  return (
    <ScrollArea contentStyle={styles.content} style={styles.scroll}>
      <section {...props(styles.section)}>
        <h2 {...props(text.heading2, styles.heading, styles.ally)}>{t('champSelect.yourTeamBans')}</h2>

        {renderBans(readBanSlots(champSelect.actions, true))}
      </section>

      {stage === 'bans-revealed' ? (
        <section {...props(styles.section)}>
          <h2 {...props(text.heading2, styles.heading, styles.enemy)}>{t('champSelect.enemyTeamBans')}</h2>

          {renderBans(readBanSlots(champSelect.actions, false))}
        </section>
      ) : null}
    </ScrollArea>
  )
}

const styles = create({
  ally: {
    color: color.textLabel,
  },
  // Figma: 80px cards three to a row, 16 apart, the last row centered
  bans: {
    columnGap: 16,
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginInline: 'auto',
    maxWidth: 272,
    rowGap: 16,
  },
  content: {
    display: 'flex',
    flexDirection: 'column',
    gap: 32,
    paddingBlock: 16,
    paddingInline: 24,
  },
  enemy: {
    color: color.control,
  },
  heading: {
    margin: 0,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  scroll: {
    flexGrow: 1,
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: 32,
  },
})
