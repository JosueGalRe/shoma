import { Toggle } from '@base-ui/react/toggle'
import { ToggleGroup } from '@base-ui/react/toggle-group'
import { create, defaultMarker, props, when } from '@stylexjs/stylex'
import { Info } from 'lucide-react'

import { text } from '../text'
import { color } from '../tokens/color.stylex'

import type { StyleXStyles } from '@stylexjs/stylex'

export type TileGroupProps = Omit<ToggleGroup.Props, 'className' | 'style'> & { style?: StyleXStyles }

// Single choice by default (champions), `multiple` for picks like the two summoner spells. Arrow keys move between tiles.
export function TileGroup({ style, ...rest }: TileGroupProps) {
  return <ToggleGroup {...rest} {...props(styles.group, style)} />
}

// Adds the info badge on the top-right corner, a separate button
type TileInfoProps = { infoLabel: string; onInfoClick: () => void } | { infoLabel?: never; onInfoClick?: never }

export type TileProps = TileInfoProps & {
  disabled?: boolean
  image: string
  // Names the tile and shows over the image while selected
  label: string
  size?: 'default' | 'large'
  // Other sizes the screens use (40, 56, 173): set width and height here
  style?: StyleXStyles
  value: string
}

// Figma "Champions" (Slots/Square/Filled): champion, spell and skin art with a shimmer-300 edge.
// Selected: a shimmer ring past a background-colored gap, bracket corners and the name over a fade at the bottom.
export function Tile({ disabled = false, image, infoLabel, label, onInfoClick, size = 'default', style, value }: TileProps) {
  return (
    <div {...props(styles.root, sizes[size], style)}>
      <Toggle
        disabled={disabled}
        value={value}
        className={(state) => {
          return props(defaultMarker(), styles.tile, state.pressed && styles.pressed, state.disabled && styles.disabled)
            .className
        }}
      >
        <img alt="" draggable={false} src={image} {...props(styles.image)} />

        <span aria-hidden {...props(styles.corner, styles.topLeft)} />

        <span aria-hidden {...props(styles.corner, styles.topRight)} />

        <span aria-hidden {...props(styles.corner, styles.bottomLeft)} />

        <span aria-hidden {...props(styles.corner, styles.bottomRight)} />

        <span {...props(text.marcellus13, styles.name)}>{label}</span>
      </Toggle>

      {onInfoClick ? (
        <button aria-label={infoLabel} type="button" onClick={onInfoClick} {...props(styles.info)}>
          <Info size={22} strokeWidth={1.5} {...props(styles.infoIcon)} />
        </button>
      ) : null}
    </div>
  )
}

const styles = create({
  bottomLeft: { borderBottomWidth: 1, borderLeftWidth: 1, bottom: 4, left: 4 },
  bottomRight: { borderBottomWidth: 1, borderRightWidth: 1, bottom: 4, right: 4 },
  // Shown while selected; arms a third of each side long, as the Figma draws them at both sizes
  corner: {
    borderColor: color.accent,
    borderStyle: 'solid',
    borderWidth: 0,
    height: '33%',
    opacity: { default: 0, [when.ancestor('[data-pressed]')]: 1 },
    pointerEvents: 'none',
    position: 'absolute',
    transitionDuration: '150ms',
    transitionProperty: 'opacity',
    width: '33%',
  },
  // Not in the Figma: greyed out for champions that can't be picked
  disabled: {
    cursor: 'default',
    filter: 'grayscale(1)',
    opacity: 0.4,
  },
  group: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 16,
  },
  image: {
    display: 'block',
    height: '100%',
    objectFit: 'cover',
    width: '100%',
  },
  info: {
    // A 44px target around the 22px badge
    '::before': { content: '""', inset: -11, position: 'absolute' },
    WebkitTapHighlightColor: 'transparent',
    backgroundColor: 'transparent',
    borderWidth: 0,
    cursor: 'pointer',
    display: 'flex',
    margin: 0,
    outlineColor: color.focusRing,
    outlineStyle: { ':focus-visible': 'solid', default: 'none' },
    outlineWidth: 2,
    padding: 0,
    position: 'absolute',
    right: -10,
    top: -10,
  },
  infoIcon: {
    color: color.onAccent,
    fill: color.accent,
  },
  name: {
    backgroundImage: `linear-gradient(to top, rgb(12 21 30 / 80%) 54%, rgb(12 21 30 / 4%))`,
    bottom: 0,
    color: color.text,
    insetInline: 0,
    opacity: { default: 0, [when.ancestor('[data-pressed]')]: 1 },
    overflow: 'hidden',
    paddingInline: 4,
    position: 'absolute',
    textAlign: 'center',
    textOverflow: 'ellipsis',
    transitionDuration: '150ms',
    transitionProperty: 'opacity',
    whiteSpace: 'nowrap',
  },
  pressed: {
    '::after': { borderColor: 'transparent' },
    // Gap in the page background, then the 2px ring the Figma's 5px outside stroke leaves visible
    boxShadow: `0 0 0 3px ${color.background}, 0 0 0 5px ${color.accent}`,
  },
  root: {
    flexShrink: 0,
    position: 'relative',
  },
  tile: {
    // The 1px edge sits over the art, as the Figma's inside stroke does
    '::after': {
      borderColor: color.tileBorder,
      borderStyle: 'solid',
      borderWidth: 1,
      content: '""',
      inset: 0,
      pointerEvents: 'none',
      position: 'absolute',
      transitionDuration: '150ms',
      transitionProperty: 'border-color',
    },
    WebkitTapHighlightColor: 'transparent',
    backgroundColor: color.surface,
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
  topLeft: { borderLeftWidth: 1, borderTopWidth: 1, left: 4, top: 4 },
  topRight: { borderRightWidth: 1, borderTopWidth: 1, right: 4, top: 4 },
})

// Figma Size=Default and Size=Large (skins)
const sizes = create({
  default: { height: 80, width: 80 },
  large: { height: 105, width: 175 },
})
