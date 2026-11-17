import { text } from '@shoma/ui/text'
import { color } from '@shoma/ui/tokens/color.stylex'
import { font } from '@shoma/ui/tokens/font.stylex'
import { create, props } from '@stylexjs/stylex'
import { useTranslation } from 'react-i18next'

import type { ChampSelectHeaderProps } from './champ-select-screen-types'

// Figma "PICK YOUR CHAMPION" and "Counter": the turn's title between dots, then the seconds left over a bar that empties
// With them, orange in bans and mana in picks
export function ChampSelectHeader({ secondsLeft, secondsTotal, title, tone }: ChampSelectHeaderProps) {
  const { t } = useTranslation()
  const fraction = secondsTotal > 0 ? Math.min(1, secondsLeft / secondsTotal) : 0

  return (
    <div {...props(styles.root)}>
      <h1 {...props(text.heading2, styles.title)}>{title}</h1>

      <div aria-label={t('champSelect.timeLeft')} role="timer" {...props(styles.counter)}>
        <div {...props(styles.bar)}>
          <div {...props(styles.fill, fills[tone], styles.fraction(fraction))} />
        </div>

        <span {...props(styles.seconds)}>{secondsLeft}</span>
      </div>
    </div>
  )
}

const styles = create({
  // Figma: 292 by 13 with a 1px white edge, centered behind the seconds
  bar: {
    borderColor: color.text,
    borderStyle: 'solid',
    borderWidth: 1,
    boxSizing: 'border-box',
    height: 13,
    left: '50%',
    maxWidth: '100%',
    overflow: 'hidden',
    position: 'absolute',
    top: '50%',
    transform: 'translate(-50%, -50%)',
    width: 292,
  },
  counter: {
    display: 'flex',
    height: 52,
    justifyContent: 'center',
    position: 'relative',
  },
  fill: {
    height: '100%',
    transformOrigin: 'left',
    transitionDuration: { '@media (prefers-reduced-motion: reduce)': '0s', default: '1s' },
    transitionProperty: 'transform',
    transitionTimingFunction: 'linear',
    width: '100%',
  },
  // eslint-disable-next-line arrow-body-style -- StyleX only compiles dynamic styles written as (x) => ({ ... })
  fraction: (value: number) => ({ transform: `scaleX(${value})` }),
  root: {
    display: 'flex',
    flexDirection: 'column',
    flexShrink: 0,
    gap: 8,
    paddingBlockStart: 16,
    paddingInline: 24,
  },
  // Figma "Timer Container": Marcellus 40 in a navy pill with a white edge
  seconds: {
    alignItems: 'center',
    backgroundColor: color.timerBackground,
    borderColor: color.text,
    borderRadius: 32,
    borderStyle: 'solid',
    borderWidth: 1,
    boxSizing: 'border-box',
    color: color.text,
    display: 'flex',
    fontFamily: font.display,
    fontSize: '2.5rem',
    fontVariantNumeric: 'tabular-nums',
    height: 52,
    justifyContent: 'center',
    letterSpacing: '0.06em',
    minWidth: 50,
    paddingInline: 8,
    position: 'relative',
  },
  // Two lines tall whatever the turn says, since some titles wrap ("Waiting for other players") and the screen under it
  // Would jump each time the turn changes
  title: {
    '::after': { backgroundColor: 'currentColor', borderRadius: '50%', content: '""', flexShrink: 0, height: 4, width: 4 },
    '::before': { backgroundColor: 'currentColor', borderRadius: '50%', content: '""', flexShrink: 0, height: 4, width: 4 },
    alignItems: 'center',
    color: color.text,
    display: 'flex',
    gap: 8,
    justifyContent: 'center',
    margin: 0,
    minHeight: '2.4em',
    textAlign: 'center',
    textTransform: 'uppercase',
  },
})

const fills = create({
  ban: { backgroundImage: color.timerBan },
  pick: { backgroundImage: color.timerPick },
})
