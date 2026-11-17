import { ScrollArea } from '@shoma/ui/scroll-area'
import { text } from '@shoma/ui/text'
import { color } from '@shoma/ui/tokens/color.stylex'
import { create, props } from '@stylexjs/stylex'
import { useTranslation } from 'react-i18next'

import { readBanSlots } from '@/features/champ-select'
import { getChampionName } from '@/lib/asset-resolver'

import { BannedChampion } from './banned-champion'

import type { BansRevealProps } from './champ-select-screen-types'

// Figma "Bans locked in": both teams' bans over the grid for the few seconds the client reveals them, a row each, so
// They fit any phone without a scroll
export function BansReveal({ champSelect }: BansRevealProps) {
  const { t } = useTranslation()

  function renderTeam(isAlly: boolean) {
    return (
      <section {...props(styles.section)}>
        <h2 {...props(text.heading2, styles.heading, isAlly ? styles.ally : styles.enemy)}>
          {t(isAlly ? 'champSelect.yourTeamBans' : 'champSelect.enemyTeamBans')}
        </h2>

        <div {...props(styles.bans)}>
          {readBanSlots(champSelect.actions, isAlly).map((slot) => {
            return (
              <BannedChampion
                key={slot.id}
                championId={slot.championId}
                name={slot.championId ? (getChampionName(slot.championId, champSelect.champions) ?? '') : ''}
              />
            )
          })}
        </div>
      </section>
    )
  }

  return (
    <ScrollArea contentStyle={styles.content} style={styles.scroll}>
      {renderTeam(true)}

      {renderTeam(false)}
    </ScrollArea>
  )
}

const styles = create({
  ally: {
    color: color.textLabel,
  },
  bans: {
    display: 'flex',
    gap: 8,
    justifyContent: 'center',
  },
  // Centered in the room the grid leaves
  content: {
    display: 'flex',
    flexDirection: 'column',
    gap: 32,
    justifyContent: 'center',
    minHeight: '100%',
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
  // Room under the cards for the ban mark astride their edge
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
    paddingBlockEnd: 10,
  },
})
