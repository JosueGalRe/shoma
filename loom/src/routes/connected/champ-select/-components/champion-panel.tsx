import { AramPanel } from './aram-panel'
import { ChampionPickPanel } from './champion-pick-panel'
import { SkinPanel } from './skin-panel'

import type { ChampionPanelProps } from './champ-select-screen-types'

// The champion tab: the grid until the champion is locked (between the player's turns a tap declares the intent, as in
// Planning), then the skins. ARAM has its cards and bench instead
export function ChampionPanel({ actionSlot, champSelect, stage }: ChampionPanelProps) {
  if (champSelect.isAram) {
    return <AramPanel actionSlot={actionSlot} champSelect={champSelect} />
  }

  if (stage === 'locked' || stage === 'finalization') {
    return <SkinPanel champSelect={champSelect} />
  }

  return <ChampionPickPanel actionSlot={actionSlot} champSelect={champSelect} stage={stage} />
}
