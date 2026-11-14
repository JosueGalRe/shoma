import { Icon } from '@shoma/ui/icon'
import { color } from '@shoma/ui/tokens/color.stylex'
import { create, props } from '@stylexjs/stylex'

import type { LobbySlotProps } from './lobby-screen-types'

// Figma "Champion Slot": dotted with its icon while empty, the shimmer edge around its pick (an icon or art) once set
export function LobbySlot({ icon, image, picked, size = 'large', style }: LobbySlotProps) {
  return (
    <span aria-hidden {...props(styles.slot, sizes[size], picked && styles.picked, style)}>
      {image ? <img alt="" src={image} {...props(styles.image)} /> : null}

      {!image && icon ? <Icon name={icon} size={size === 'large' ? 32 : 20} /> : null}
    </span>
  )
}

const styles = create({
  image: {
    height: '100%',
    objectFit: 'cover',
    width: '100%',
  },
  picked: {
    borderColor: color.accent,
    borderStyle: 'solid',
    color: color.primary,
  },
  slot: {
    alignItems: 'center',
    borderColor: color.primary,
    borderStyle: 'dotted',
    borderWidth: 2,
    boxSizing: 'border-box',
    color: color.icon,
    display: 'flex',
    justifyContent: 'center',
    overflow: 'hidden',
    transitionDuration: '150ms',
    transitionProperty: 'border-color, color',
  },
})

const sizes = create({
  large: { height: 80, width: 80 },
  small: { height: 38, width: 38 },
})
