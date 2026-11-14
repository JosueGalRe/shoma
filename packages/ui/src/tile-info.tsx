import { create, props } from '@stylexjs/stylex'
import { Info } from 'lucide-react'

import { color } from './tokens/color.stylex'

import type { StyleXStyles } from '@stylexjs/stylex'

// The optional info badge of Tile and RoundTile: both take either both props or neither
export type TileInfoProps = { infoLabel: string; onInfoClick: () => void } | { infoLabel?: never; onInfoClick?: never }

// Figma "info": a shimmer-500 dot with a mana-50 outline and "i", a button of its own beside the tile's toggle
export function TileInfo({ label, onClick, style }: { label: string; onClick: () => void; style: StyleXStyles }) {
  return (
    <button aria-label={label} type="button" onClick={onClick} {...props(styles.info, style)}>
      <Info size={22} strokeWidth={1.5} {...props(styles.icon)} />
    </button>
  )
}

const styles = create({
  icon: {
    color: color.onAccent,
    fill: color.accent,
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
  },
})
