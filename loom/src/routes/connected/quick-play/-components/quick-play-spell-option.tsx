import { FadeImage } from '@shoma/ui/fade-image'
import { text } from '@shoma/ui/text'
import { TileInfo } from '@shoma/ui/tile-info'
import { color } from '@shoma/ui/tokens/color.stylex'
import { create, props } from '@stylexjs/stylex'
import { useTranslation } from 'react-i18next'

import type { QuickPlaySpellOptionProps } from './quick-play-screen-types'

const ICON_SIZE = 64

// A summoner spell drawn as Select Position draws a lane: its art, its name and a line under them. Picked, it rings mana on
// D and shimmer on F, as the primary and secondary positions light up, and the line names its key
export function QuickPlaySpellOption({
  caption,
  infoLabel,
  locked,
  onInfoClick,
  onPick,
  slot,
  spell,
  spellIcon,
}: QuickPlaySpellOptionProps) {
  const { t } = useTranslation()
  const line = slot === null ? caption : t(slot === 'first' ? 'lobby.quickPlay.spellD' : 'lobby.quickPlay.spellF')

  return (
    <div {...props(styles.root)}>
      <button aria-pressed={slot !== null} disabled={locked} type="button" onClick={onPick} {...props(styles.option)}>
        <span {...props(styles.frame, slot && rings[slot], locked && styles.locked)}>
          <FadeImage src={spellIcon} style={styles.image} />
        </span>

        <span {...props(text.body3, styles.name, locked && styles.locked)}>{spell.name}</span>

        {/* Keeps its height while empty, so picking doesn't move the grid */}
        <span {...props(text.body4, styles.line, line === null && styles.hidden)}>{line ?? ' '}</span>
      </button>

      <TileInfo label={infoLabel} style={styles.info} onClick={onInfoClick} />
    </div>
  )
}

const styles = create({
  // The Figma tile's 1px shimmer-300 edge; the ring comes out past a background-colored gap, as on a picked tile
  frame: {
    borderColor: color.tileBorder,
    borderStyle: 'solid',
    borderWidth: 1,
    boxShadow: `0 0 0 0 ${color.background}, 0 0 0 0 ${color.accent}`,
    boxSizing: 'border-box',
    display: 'block',
    height: ICON_SIZE,
    marginBlockEnd: 6,
    transitionDuration: '150ms',
    transitionProperty: 'box-shadow',
    width: ICON_SIZE,
  },
  hidden: {
    opacity: 0,
  },
  image: {
    display: 'block',
    height: '100%',
    objectFit: 'cover',
    width: '100%',
  },
  // On the art's top-right corner, as on the Figma's spell tiles: 10px past it, over the option's 8px padding
  info: {
    left: 'calc(50% + 20px)',
    top: -2,
  },
  line: {
    color: color.textSecondary,
    textTransform: 'uppercase',
    transitionDuration: '150ms',
    transitionProperty: 'opacity',
  },
  // Not in the Figma: greyed out as a locked tile is
  locked: {
    filter: 'grayscale(1)',
    opacity: 0.4,
  },
  name: {
    color: color.text,
    textAlign: 'center',
  },
  option: {
    WebkitTapHighlightColor: 'transparent',
    alignItems: 'center',
    backgroundColor: { ':active:enabled': color.pressed, default: 'transparent' },
    borderWidth: 0,
    cursor: { ':disabled': 'default', default: 'pointer' },
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
    margin: 0,
    outlineColor: color.focusRing,
    outlineOffset: 2,
    outlineStyle: { ':focus-visible': 'solid', default: 'none' },
    outlineWidth: 2,
    paddingBlock: 8,
    paddingInline: 0,
    touchAction: 'manipulation',
    transitionDuration: '150ms',
    transitionProperty: 'background-color',
    width: '100%',
  },
  root: {
    position: 'relative',
  },
})

const rings = create({
  first: { boxShadow: `0 0 0 3px ${color.background}, 0 0 0 5px ${color.primary}` },
  second: { boxShadow: `0 0 0 3px ${color.background}, 0 0 0 5px ${color.accent}` },
})
