import { useState } from 'react'

import { Collapsible } from '@base-ui/react/collapsible'
import { Avatar } from '@shoma/ui/avatar'
import { Checkbox } from '@shoma/ui/checkbox'
import { Icon } from '@shoma/ui/icon'
import { text } from '@shoma/ui/text'
import { color } from '@shoma/ui/tokens/color.stylex'
import { create, props } from '@stylexjs/stylex'

import type { LobbyInviteGroupProps } from './lobby-screen-types'

// Figma "Invite" folders: a friend group that folds under its name, a checkbox per friend
export function LobbyInviteGroup({ friends, name, onToggle, selectedIds }: LobbyInviteGroupProps) {
  const [isOpen, setIsOpen] = useState(true)

  return (
    <Collapsible.Root open={isOpen} onOpenChange={setIsOpen} {...props(styles.root)}>
      <Collapsible.Trigger {...props(text.heading3Medium, styles.trigger)}>
        {name}

        <Icon name="arrow-down" size={20} style={[styles.chevron, !isOpen && styles.chevronClosed]} />
      </Collapsible.Trigger>

      <Collapsible.Panel
        className={(state) => {
          return props(
            styles.panel,
            (state.transitionStatus === 'starting' || state.transitionStatus === 'ending') && styles.folded,
          ).className
        }}
      >
        <ul {...props(styles.list)}>
          {friends.map((friend) => {
            return (
              <li key={friend.summonerId}>
                <Checkbox
                  checked={selectedIds.has(friend.summonerId)}
                  label={<Avatar online image={friend.iconUrl} name={friend.name} status={friend.status} />}
                  style={styles.row}
                  onCheckedChange={() => {
                    onToggle(friend.summonerId)
                  }}
                />
              </li>
            )
          })}
        </ul>
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
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
    listStyle: 'none',
    margin: 0,
    paddingBlockStart: 16,
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
  // Figma: the friend's row is 72 tall, 16 after the checkbox
  row: {
    gap: 16,
    paddingBlock: 8,
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
