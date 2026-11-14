import { useState } from 'react'

import { Avatar } from '@shoma/ui/avatar'
import { EmptySlot } from '@shoma/ui/empty-slot'
import { Icon } from '@shoma/ui/icon'
import { text } from '@shoma/ui/text'
import { color } from '@shoma/ui/tokens/color.stylex'
import { create, keyframes, props } from '@stylexjs/stylex'
import { Crown } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { getPartySlots } from './lobby-party-utils'
import { LobbyRoleTile } from './lobby-role-tile'

import type { LobbyPartyProps } from './lobby-screen-types'
import type { SummonerId } from '@/core/types/branded'

const AVATAR_SIZE = 80
// Between slot centers; the Figma spaces the ones beside the arch 122 and the outer ones 106
const SLOT_STEP = 114

// Figma "Carrousel" and "Card": the party in a row that slides the tapped member over the arch, which shows their name,
// Crown and positions. Free places are invite slots
export function LobbyParty({ canInvite, children, members, onEditRoles, onInvite, showRoles, size }: LobbyPartyProps) {
  const { t } = useTranslation()
  const [pickedId, setPickedId] = useState<SummonerId | null>(null)
  const slots = getPartySlots(members, size)
  const pickedSlot = slots.findIndex((slot) => {
    return slot !== null && slot.summonerId === pickedId
  })
  // The local player sits in the middle; a picked member who left hands the arch back to them
  const focusedSlot = pickedSlot === -1 ? Math.floor((size - 1) / 2) : pickedSlot
  const focused = slots[focusedSlot]
  const onRoleClick = focused?.isLocalMember ? onEditRoles : undefined

  return (
    <section aria-label={t('lobby.members')} {...props(styles.party)}>
      <div aria-hidden {...props(styles.arch)} />

      <ul {...props(styles.row, styles.offset(-(focusedSlot * SLOT_STEP + AVATAR_SIZE / 2)))}>
        {slots.map((member, index) => {
          if (!member) {
            return (
              <li key={`invite-${index}`} {...props(styles.slot)}>
                <EmptySlot
                  aria-label={t('lobby.invitePlayer')}
                  disabled={!canInvite}
                  icon={<Icon name="add" />}
                  variant="friend"
                  onClick={onInvite}
                />
              </li>
            )
          }

          const isFocused = index === focusedSlot

          return (
            <li key={member.summonerId} {...props(styles.slot)}>
              <button
                aria-label={member.isLeader ? `${member.displayName}, ${t('lobby.owner')}` : member.displayName}
                aria-pressed={isFocused}
                type="button"
                onClick={() => {
                  setPickedId(member.summonerId)
                }}
                {...props(styles.member)}
              >
                <Avatar image={member.iconUrl ?? undefined} name={member.displayName} size="large" />
              </button>

              {member.isLeader ? (
                <Crown aria-hidden {...props(styles.crown, styles.slotCrown, isFocused && styles.hidden)} />
              ) : null}
            </li>
          )
        })}
      </ul>

      {focused ? (
        <div key={focused.summonerId} {...props(styles.details)}>
          <p {...props(text.body1, styles.name)}>{focused.displayName}</p>

          {focused.isLeader ? <Crown aria-hidden {...props(styles.crown)} /> : null}

          {showRoles ? (
            <div {...props(styles.roles)}>
              <LobbyRoleTile priority="primary" role={focused.firstPositionPreference} onClick={onRoleClick} />

              {focused.firstPositionPreference === 'FILL' ? null : (
                <LobbyRoleTile priority="secondary" role={focused.secondPositionPreference} onClick={onRoleClick} />
              )}
            </div>
          ) : null}
        </div>
      ) : null}

      {children ? <div {...props(styles.bottom)}>{children}</div> : null}
    </section>
  )
}

const fadeIn = keyframes({
  from: { opacity: 0 },
  to: { opacity: 1 },
})

const styles = create({
  // Figma "Card": 252 wide with a round top, from just under the avatars' top to past the bottom of the screen
  arch: {
    backgroundColor: color.panel,
    borderStartEndRadius: 126,
    borderStartStartRadius: 126,
    bottom: 0,
    left: '50%',
    position: 'absolute',
    top: 35,
    transform: 'translateX(-50%)',
    width: 252,
  },
  bottom: {
    marginBlockStart: 32,
    position: 'relative',
    width: 252,
  },
  crown: {
    color: color.leader,
    fill: 'currentColor',
    flexShrink: 0,
    height: 14,
    transitionDuration: '150ms',
    transitionProperty: 'opacity',
    width: 14,
  },
  details: {
    alignItems: 'center',
    animationDuration: '200ms',
    animationName: fadeIn,
    animationTimingFunction: 'ease-out',
    display: 'flex',
    flexDirection: 'column',
    paddingBlockStart: 8,
    position: 'relative',
    width: 252,
  },
  hidden: {
    opacity: 0,
  },
  member: {
    WebkitTapHighlightColor: 'transparent',
    backgroundColor: 'transparent',
    borderRadius: '50%',
    borderWidth: 0,
    cursor: 'pointer',
    display: 'block',
    margin: 0,
    outlineColor: color.focusRing,
    outlineOffset: 2,
    outlineStyle: { ':focus-visible': 'solid', default: 'none' },
    outlineWidth: 2,
    padding: 0,
    touchAction: 'manipulation',
  },
  // The Figma wraps the name at the avatar frame's 112px, two lines at most
  name: {
    WebkitBoxOrient: 'vertical',
    WebkitLineClamp: 2,
    color: color.text,
    display: '-webkit-box',
    margin: 0,
    overflow: 'hidden',
    overflowWrap: 'anywhere',
    textAlign: 'center',
    width: 112,
  },
  // eslint-disable-next-line arrow-body-style -- StyleX only compiles dynamic styles written as (x) => ({ ... })
  offset: (x: number) => ({ transform: `translateX(${x}px)` }),
  party: {
    alignItems: 'center',
    display: 'flex',
    flexDirection: 'column',
    flexGrow: 1,
    // Figma: 81px under the title; shorter phones keep less
    marginBlockStart: 'clamp(16px, 9dvh, 81px)',
    minHeight: 0,
    overflow: 'hidden',
    position: 'relative',
  },
  roles: {
    display: 'flex',
    gap: 16,
    marginBlockStart: 'clamp(16px, 7dvh, 64px)',
  },
  // Starts at the screen's center; the offset slides the focused slot onto it
  row: {
    alignSelf: 'flex-start',
    display: 'flex',
    flexShrink: 0,
    gap: SLOT_STEP - AVATAR_SIZE,
    listStyle: 'none',
    margin: 0,
    marginInlineStart: '50%',
    padding: 0,
    position: 'relative',
    transitionDuration: { '@media (prefers-reduced-motion: reduce)': '0s', default: '300ms' },
    transitionProperty: 'transform',
    transitionTimingFunction: 'ease-out',
  },
  slot: {
    flexShrink: 0,
    height: AVATAR_SIZE,
    position: 'relative',
    width: AVATAR_SIZE,
  },
  // A leader off the arch wears the crown under their avatar
  slotCrown: {
    left: '50%',
    position: 'absolute',
    top: AVATAR_SIZE + 9,
    transform: 'translateX(-50%)',
  },
})
