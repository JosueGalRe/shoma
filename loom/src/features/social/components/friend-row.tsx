import { Avatar } from '@shoma/ui/avatar'
import { color } from '@shoma/ui/tokens/color.stylex'
import { create, props } from '@stylexjs/stylex'

import { UnreadBadge } from './unread-badge'

import type { FriendRowProps } from '../social-types'

// Figma "Avatar" row in the Social list: the friend's picture, name and what they're doing; a tap opens the chat
export function FriendRow({ iconUrl, name, online, onSelect, status, unread }: FriendRowProps) {
  return (
    <li>
      <button type="button" onClick={onSelect} {...props(styles.row)}>
        <Avatar image={iconUrl} name={name} online={online} status={status} />

        {unread > 0 ? <UnreadBadge count={unread} /> : null}
      </button>
    </li>
  )
}

const styles = create({
  row: {
    WebkitTapHighlightColor: 'transparent',
    alignItems: 'center',
    backgroundColor: { ':active': color.pressed, default: 'transparent' },
    borderRadius: 8,
    borderWidth: 0,
    boxSizing: 'border-box',
    color: color.text,
    cursor: 'pointer',
    display: 'flex',
    gap: 16,
    outlineColor: color.focusRing,
    outlineOffset: -2,
    outlineStyle: { ':focus-visible': 'solid', default: 'none' },
    outlineWidth: 2,
    paddingBlock: 8,
    paddingInline: 16,
    textAlign: 'start',
    transitionDuration: '150ms',
    transitionProperty: 'background-color',
    width: '100%',
  },
})
