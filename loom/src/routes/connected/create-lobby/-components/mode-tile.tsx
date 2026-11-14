import { Radio } from '@base-ui/react/radio'
import { text } from '@shoma/ui/text'
import { color } from '@shoma/ui/tokens/color.stylex'
import { create, props } from '@stylexjs/stylex'
import { useTranslation } from 'react-i18next'

import { ModeIconVideo } from './mode-icon-video'

import type { ModeTileProps } from './create-lobby-steps-types'

const TEAM_SIZES: Record<string, string> = { aram: '5v5', clash: '5v5', classic: '5v5', sr: '5v5' }

// Figma "Mode": the client's mode icon, lit and animated when picked, over its team size and name.
// Both stills stay mounted, so picking one crossfades instead of waiting for the lit image to load
export function ModeTile({ mode, selected }: ModeTileProps) {
  const { t } = useTranslation()
  const { icon } = mode
  const teamSize = TEAM_SIZES[mode.id]

  return (
    <Radio.Root value={mode.id} {...props(text.body1, styles.tile)}>
      <span {...props(styles.iconBox)}>
        {icon ? (
          <>
            <img alt="" src={icon.default} {...props(styles.icon, selected && styles.hidden)} />

            <img alt="" src={icon.active} {...props(styles.icon, !selected && styles.hidden)} />

            {selected && icon.activeVideo ? (
              <ModeIconVideo activeVideo={icon.activeVideo} introVideo={icon.introVideo} />
            ) : null}
          </>
        ) : null}
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
    objectFit: 'contain',
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
