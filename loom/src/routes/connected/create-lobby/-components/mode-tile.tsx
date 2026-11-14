import { Radio } from '@base-ui/react/radio'
import { text } from '@shoma/ui/text'
import { color } from '@shoma/ui/tokens/color.stylex'
import { create, props } from '@stylexjs/stylex'
import { useTranslation } from 'react-i18next'

import type { ModeTileProps } from './create-lobby-steps-types'

// Icons exported from the Figma into public/game-modes; Clash has none of its own and shares the Rift's
const ICONS: Record<string, string> = {
  aram: 'aram',
  arena: 'arena',
  clash: 'summoners-rift',
  classic: 'classic-rift',
  sr: 'summoners-rift',
}

const TEAM_SIZES: Record<string, string> = { aram: '5v5', clash: '5v5', classic: '5v5', sr: '5v5' }

// Figma "Mode": the client's mode icon, lit when picked, over its team size and name.
// Both icons stay mounted, so picking one crossfades instead of waiting for the lit image to load
export function ModeTile({ mode, selected }: ModeTileProps) {
  const { t } = useTranslation()
  const icon = ICONS[mode.id] ?? 'summoners-rift'
  const teamSize = TEAM_SIZES[mode.id]

  return (
    <Radio.Root value={mode.id} {...props(text.body1, styles.tile)}>
      <span {...props(styles.iconBox)}>
        <img alt="" src={`/game-modes/${icon}.png`} {...props(styles.icon, selected && styles.hidden)} />

        <img alt="" src={`/game-modes/${icon}-selected.png`} {...props(styles.icon, !selected && styles.hidden)} />
      </span>

      {teamSize ? <span>{teamSize}</span> : null}

      <span {...props(styles.name)}>{t(mode.nameKey)}</span>
    </Radio.Root>
  )
}

const styles = create({
  hidden: {
    opacity: 0,
  },
  icon: {
    height: '100%',
    inset: 0,
    objectFit: 'cover',
    position: 'absolute',
    transitionDuration: '150ms',
    transitionProperty: 'opacity',
    transitionTimingFunction: 'ease-out',
    width: '100%',
  },
  iconBox: {
    height: 116,
    position: 'relative',
    width: 116,
  },
  name: {
    textTransform: 'uppercase',
  },
  tile: {
    WebkitTapHighlightColor: 'transparent',
    alignItems: 'center',
    color: color.text,
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    minHeight: 182,
    outlineColor: color.focusRing,
    outlineOffset: 2,
    outlineStyle: { ':focus-visible': 'solid', default: 'none' },
    outlineWidth: 2,
    textAlign: 'center',
    userSelect: 'none',
  },
})
