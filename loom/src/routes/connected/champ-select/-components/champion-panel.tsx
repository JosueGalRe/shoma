import { Button } from '@shoma/ui/button'
import { create, props } from '@stylexjs/stylex'
import { useTranslation } from 'react-i18next'

import { BansPanel } from './bans-panel'
import { ChampionPickPanel } from './champion-pick-panel'
import { SkinPanel } from './skin-panel'

import type { ChampionPanelProps } from './champ-select-screen-types'

// The champion tab: the grid while choosing, the bans while others ban, and the skins once the champion is locked
export function ChampionPanel({ actionSlot, champSelect, onOpenAram, stage }: ChampionPanelProps) {
  const { t } = useTranslation()

  // Shortcut: ARAM keeps the old cards overlay until its Figma frames are built
  if (champSelect.isAram) {
    return (
      <div {...props(styles.aram)}>
        <Button variant="secondary" onClick={onOpenAram}>
          {t('champSelect.chooseCard')}
        </Button>
      </div>
    )
  }

  if (stage === 'locked' || stage === 'finalization') {
    return <SkinPanel champSelect={champSelect} />
  }

  if (stage === 'bans-allies' || stage === 'bans-enemies' || stage === 'bans-revealed') {
    return <BansPanel champSelect={champSelect} stage={stage} />
  }

  return <ChampionPickPanel actionSlot={actionSlot} champSelect={champSelect} stage={stage} />
}

const styles = create({
  aram: {
    display: 'flex',
    flexDirection: 'column',
    flexGrow: 1,
    justifyContent: 'center',
    paddingInline: 24,
  },
})
