import { useState } from 'react'

import { Collapsible } from '@base-ui/react/collapsible'
import { Icon } from '@shoma/ui/icon'
import { text } from '@shoma/ui/text'
import { color } from '@shoma/ui/tokens/color.stylex'
import { create, props } from '@stylexjs/stylex'

import { UnreadBadge } from './unread-badge'

import type { FriendGroupProps } from '../social-types'

// Figma "Group": a list of friends that folds under its name, as the lobby's invite folders do
export function FriendGroup({ children, title, unread = 0 }: FriendGroupProps) {
  const [isOpen, setIsOpen] = useState(true)

  return (
    <Collapsible.Root open={isOpen} onOpenChange={setIsOpen} {...props(styles.root)}>
      <Collapsible.Trigger {...props(text.heading3Medium, styles.trigger)}>
        {title}

        <Icon name="arrow-down" size={20} style={[styles.chevron, !isOpen && styles.chevronClosed]} />

        {/* The client counts them on the name only while the friends are hidden */}
        {!isOpen && unread > 0 ? <UnreadBadge count={unread} /> : null}
      </Collapsible.Trigger>

      <Collapsible.Panel
        className={(state) => {
          return props(
            styles.panel,
            (state.transitionStatus === 'starting' || state.transitionStatus === 'ending') && styles.folded,
          ).className
        }}
      >
        <ul {...props(styles.list)}>{children}</ul>
      </Collapsible.Panel>
    </Collapsible.Root>
  )
}

const styles = create({
  chevron: {
    transitionDuration: { '@media (prefers-reduced-motion: reduce)': '0s', default: '200ms' },
    transitionProperty: 'transform',
  },
  chevronClosed: {
    transform: 'rotate(-90deg)',
  },
  folded: {
    height: 0,
  },
  // Figma: 8 under the name and between the 72px rows
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    listStyle: 'none',
    margin: 0,
    paddingBlockStart: 8,
    paddingInline: 0,
  },
  panel: {
    height: 'var(--collapsible-panel-height)',
    overflow: 'hidden',
    transitionDuration: { '@media (prefers-reduced-motion: reduce)': '0s', default: '200ms' },
    transitionProperty: 'height',
    transitionTimingFunction: 'ease-out',
  },
  root: {
    display: 'flex',
    flexDirection: 'column',
  },
  trigger: {
    WebkitTapHighlightColor: 'transparent',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'transparent',
    borderWidth: 0,
    color: color.text,
    cursor: 'pointer',
    display: 'flex',
    gap: 8,
    outlineColor: color.focusRing,
    outlineOffset: 2,
    outlineStyle: { ':focus-visible': 'solid', default: 'none' },
    outlineWidth: 2,
    padding: 0,
  },
})
