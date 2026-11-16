import { AramPanel } from './aram-panel'
import { BansPanel } from './bans-panel'
import { ChampionPickPanel } from './champion-pick-panel'
import { SkinPanel } from './skin-panel'

import type { ChampionPanelProps } from './champ-select-screen-types'

// The champion tab: the grid while choosing, the bans while others ban, and the skins once the champion is locked.
// ARAM has its cards and bench instead
export function ChampionPanel({ actionSlot, champSelect, stage }: ChampionPanelProps) {
  if (champSelect.isAram) {
    return <AramPanel actionSlot={actionSlot} champSelect={champSelect} />
  }

  if (stage === 'locked' || stage === 'finalization') {
    return <SkinPanel champSelect={champSelect} />
  }

  if (stage === 'bans-allies' || stage === 'bans-enemies' || stage === 'bans-revealed') {
    return <BansPanel champSelect={champSelect} stage={stage} />
  }

  return <ChampionPickPanel actionSlot={actionSlot} champSelect={champSelect} stage={stage} />
}
