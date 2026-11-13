import { Avatar as BaseAvatar } from '@base-ui/react/avatar'
import { create, props } from '@stylexjs/stylex'

import { text } from '../text'
import { color } from '../tokens/color.stylex'
import { font } from '../tokens/font.stylex'

import type { StyleXStyles } from '@stylexjs/stylex'

export interface AvatarProps {
  // Profile icon; without one, or while it fails to load, the initials show
  image?: string
  // The image's alt text, or the first line beside it when there's a status
  name: string
  // The mana-400 dot on the edge
  online?: boolean
  size?: 'large' | 'medium' | 'small'
  // Shows the name and this line beside the picture, as in the Social list ("En partida")
  status?: string
  style?: StyleXStyles
}

// Figma "Avatar": a round profile icon with a white edge and an optional presence dot
export function Avatar({ image, name, online = false, size = 'medium', status, style }: AvatarProps) {
  const picture = (
    <BaseAvatar.Root {...props(styles.picture, sizes[size], status === undefined && style)}>
      {image ? <BaseAvatar.Image alt={status === undefined ? name : ''} src={image} {...props(styles.image)} /> : null}

      <BaseAvatar.Fallback aria-hidden {...props(styles.initials)}>
        {initials(name)}
      </BaseAvatar.Fallback>

      {online ? <span aria-hidden {...props(styles.badge, badges[size])} /> : null}
    </BaseAvatar.Root>
  )

  if (status === undefined) {
    return picture
  }

  return (
    <div {...props(styles.row, style)}>
      {picture}

      <div {...props(styles.text)}>
        <span {...props(text.heading3Medium, styles.line)}>{name}</span>

        <span {...props(text.body1, styles.line)}>{status}</span>
      </div>
    </div>
  )
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => {
      return word.charAt(0)
    })
    .join('')
}

const styles = create({
  badge: {
    backgroundColor: color.textLabel,
    borderRadius: '50%',
    // The Figma's 2px drop shadow: a ring in the page color that cuts the dot out of the edge
    boxShadow: `0 0 0 2px ${color.background}`,
    position: 'absolute',
    // Above the white edge
    zIndex: 1,
  },
  image: {
    borderRadius: '50%',
    height: '100%',
    objectFit: 'cover',
    width: '100%',
  },
  initials: {
    color: color.text,
    fontFamily: font.display,
    fontSize: '0.75rem',
    letterSpacing: '0.08rem',
    textTransform: 'uppercase',
  },
  line: {
    color: color.text,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  picture: {
    // The white edge sits over the picture, as the Figma's inside stroke does
    '::after': {
      borderRadius: '50%',
      boxShadow: `inset 0 0 0 1px ${color.text}`,
      content: '""',
      inset: 0,
      pointerEvents: 'none',
      position: 'absolute',
    },
    alignItems: 'center',
    backgroundColor: color.surface,
    borderRadius: '50%',
    display: 'inline-flex',
    flexShrink: 0,
    justifyContent: 'center',
    position: 'relative',
    userSelect: 'none',
  },
  row: {
    alignItems: 'center',
    display: 'flex',
    gap: 16,
    minWidth: 0,
  },
  text: {
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
  },
})

const sizes = create({
  large: { height: 80, width: 80 },
  medium: { height: 56, width: 56 },
  small: { height: 32, width: 32 },
})

// Where the Figma puts the dot at each size
const badges = create({
  large: { bottom: 0, height: 16, right: 9, width: 16 },
  medium: { bottom: -3, height: 16, right: -1, width: 16 },
  small: { bottom: -1, height: 8, right: 3, width: 8 },
})
