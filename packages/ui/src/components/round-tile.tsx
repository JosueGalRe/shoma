import { Toggle } from '@base-ui/react/toggle'
import { create, defaultMarker, props, when } from '@stylexjs/stylex'

import { TileInfo } from '../tile-info'
import { color } from '../tokens/color.stylex'

import type { TileInfoProps } from '../tile-info'
import type { StyleXStyles } from '@stylexjs/stylex'

export type RoundTileProps = TileInfoProps & {
  disabled?: boolean
  image: string
  // The accessible name; round tiles show no text
  label: string
  size?: 'default' | 'medium' | 'small'
  style?: StyleXStyles
  value: string
}

// Figma "Slot" (Slots/Rounded): a rune or rune path in the rune editor. Goes in a TileGroup like Tile. Selected
// (Figma State=Active), it gets a 2px shimmer ring past a background-colored gap and four arcs inside the edge.
export function RoundTile({
  disabled = false,
  image,
  infoLabel,
  label,
  onInfoClick,
  size = 'default',
  style,
  value,
}: RoundTileProps) {
  return (
    <div {...props(styles.root, sizes[size], style)}>
      <Toggle
        aria-label={label}
        disabled={disabled}
        value={value}
        className={(state) => {
          return props(defaultMarker(), styles.tile, state.pressed && styles.pressed, state.disabled && styles.disabled)
            .className
        }}
      >
        <img alt="" draggable={false} src={image} {...props(styles.image)} />

        <span aria-hidden {...props(styles.arcs)} />
      </Toggle>

      {infoLabel !== undefined && onInfoClick ? <TileInfo label={infoLabel} style={styles.info} onClick={onInfoClick} /> : null}
    </div>
  )
}

const styles = create({
  // A 1px ring cut at the top, right, bottom and left, leaving an arc in each quarter
  arcs: {
    borderColor: color.accent,
    borderRadius: '50%',
    borderStyle: 'solid',
    borderWidth: 1,
    inset: 2,
    maskImage: 'repeating-conic-gradient(from -12deg, transparent 0 24deg, #000 24deg 90deg)',
    opacity: { default: 0, [when.ancestor('[data-pressed]')]: 1 },
    pointerEvents: 'none',
    position: 'absolute',
    transitionDuration: '150ms',
    transitionProperty: 'opacity',
  },
  // Not in the Figma: greyed out like a disabled Tile
  disabled: {
    cursor: 'default',
    filter: 'grayscale(1)',
    opacity: 0.4,
  },
  image: {
    borderRadius: '50%',
    display: 'block',
    height: '100%',
    objectFit: 'cover',
    width: '100%',
  },
  // The badge on the top-right of the circle, a separate button
  info: {
    right: -4,
    top: -4,
  },
  pressed: {
    boxShadow: `0 0 0 3px ${color.background}, 0 0 0 5px ${color.accent}`,
  },
  root: {
    flexShrink: 0,
    position: 'relative',
  },
  tile: {
    WebkitTapHighlightColor: 'transparent',
    backgroundColor: 'transparent',
    borderRadius: '50%',
    borderWidth: 0,
    boxShadow: `0 0 0 0 ${color.background}, 0 0 0 0 ${color.accent}`,
    cursor: 'pointer',
    display: 'block',
    height: '100%',
    margin: 0,
    outlineColor: color.focusRing,
    outlineOffset: 7,
    outlineStyle: { ':focus-visible': 'solid', default: 'none' },
    outlineWidth: 2,
    padding: 0,
    position: 'relative',
    touchAction: 'manipulation',
    transitionDuration: '150ms',
    transitionProperty: 'box-shadow, opacity, filter',
    transitionTimingFunction: 'ease-out',
    userSelect: 'none',
    width: '100%',
  },
})

// Figma Size=Default (and Large, the same 80px), Medium and Small
const sizes = create({
  default: { height: 80, width: 80 },
  medium: { height: 64, width: 64 },
  small: { height: 48, width: 48 },
})
