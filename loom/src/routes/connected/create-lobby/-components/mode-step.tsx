import { RadioGroup } from '@shoma/ui/radio-group'
import { create } from '@stylexjs/stylex'
import { useTranslation } from 'react-i18next'

import { ModeTile } from './mode-tile'

import type { ModeStepProps } from './create-lobby-steps-types'

// Figma "Select Mode": the PvP modes as a two-column grid of the client's mode icons
export function ModeStep({ modeId, modes, onModeChange }: ModeStepProps) {
  const { t } = useTranslation()

  return (
    <RadioGroup aria-label={t('createLobby.steps.mode')} style={styles.grid} value={modeId} onValueChange={onModeChange}>
      {modes.map((mode) => {
        return <ModeTile key={mode.id} mode={mode} selected={mode.id === modeId} />
      })}
    </RadioGroup>
  )
}

const styles = create({
  // 163px tiles as in the 412px frame, narrower on smaller phones
  grid: {
    columnGap: 16,
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(0, 163px))',
    justifyContent: 'space-between',
    rowGap: 21,
  },
})
