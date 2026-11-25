import { create, props } from '@stylexjs/stylex'

import { BRAVERY_CHAMPION_ID } from '@/features/champ-select/arena'

import { AramPanel } from './aram-panel'
import { BansReveal } from './bans-reveal'
import { BraveryPanel } from './bravery-panel'
import { ChampionPickPanel } from './champion-pick-panel'
import { SkinPanel } from './skin-panel'

import type { ChampionPanelProps } from './champ-select-screen-types'

// The champion tab: the grid until the champion is locked (between the player's turns a tap declares the intent, as in
// Planning), then the skins. While the client reveals the bans they cover the grid, which fades back with its search
// Kept. ARAM has its cards and bench instead
export function ChampionPanel({ actionSlot, champSelect, stage }: ChampionPanelProps) {
  if (champSelect.isAram) {
    return <AramPanel champSelect={champSelect} />
  }

  if (stage === 'locked' || stage === 'finalization') {
    const local = champSelect.team.find(({ cellId }) => {
      return cellId === champSelect.localPlayerCellId
    })

    return local?.championId === BRAVERY_CHAMPION_ID ? <BraveryPanel /> : <SkinPanel champSelect={champSelect} />
  }

  const isRevealing = stage === 'bans-revealed'

  return (
    <div {...props(styles.stack)}>
      <div inert={isRevealing} {...props(styles.layer, isRevealing && styles.hidden)}>
        <ChampionPickPanel actionSlot={actionSlot} champSelect={champSelect} stage={stage} />
      </div>

      <div inert={!isRevealing} {...props(styles.layer, !isRevealing && styles.hidden)}>
        <BansReveal champSelect={champSelect} />
      </div>
    </div>
  )
}

const styles = create({
  hidden: {
    opacity: 0,
    visibility: 'hidden',
  },
  layer: {
    display: 'flex',
    flexDirection: 'column',
    gridColumn: 1,
    gridRow: 1,
    minHeight: 0,
    opacity: 1,
    transitionDuration: { '@media (prefers-reduced-motion: reduce)': '0s', default: '250ms' },
    transitionProperty: 'opacity, visibility',
  },
  // Both layers in one cell, so the grid stays mounted under the reveal
  stack: {
    display: 'grid',
    flexGrow: 1,
    gridTemplateColumns: 'minmax(0, 1fr)',
    gridTemplateRows: 'minmax(0, 1fr)',
    minHeight: 0,
  },
})
