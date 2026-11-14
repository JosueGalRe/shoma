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
// Between slot centers; the Figma spaces the ones beside the card 122 and the outer ones 106
const SLOT_STEP = 114
const TOKEN_SLOTS = ['first', 'second', 'third'] as const
// The banner's 580px art drawn so its 392px cloth is the Figma card's 252
const BANNER_WIDTH = 373

// Figma "Carrousel" and "Card": the party in a row that slides the tapped member over their banner (the client's, in
// Place of the Figma's arch), which shows their name, crown, tokens and positions. Free places are invite slots
export function LobbyParty({ canInvite, children, members, onEditRoles, onInvite, regalia, showRoles, size }: LobbyPartyProps) {
  const { t } = useTranslation()
  const [pickedId, setPickedId] = useState<SummonerId | null>(null)
  const slots = getPartySlots(members, size)
  const pickedSlot = slots.findIndex((slot) => {
    return slot !== null && slot.summonerId === pickedId
  })
  // The local player sits in the middle; a picked member who left hands the banner back to them
  const focusedSlot = pickedSlot === -1 ? Math.floor((size - 1) / 2) : pickedSlot
  const focused = slots[focusedSlot]
  const focusedRegalia = focused ? regalia.get(focused.summonerId) : undefined
  const canEditRoles = Boolean(focused?.isLocalMember && onEditRoles)

  return (
    <section aria-label={t('lobby.members')} {...props(styles.party)}>
      {focused && focusedRegalia?.bannerUrl ? (
        <div aria-hidden {...props(styles.bannerFrame)}>
          <img key={focused.summonerId} alt="" src={focusedRegalia.bannerUrl} {...props(styles.banner)} />
        </div>
      ) : null}

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
          {/* As in the client, the banner shows the game name without the #tag */}
          <p {...props(text.body1, styles.name)}>{focused.displayName.split('#', 1)[0]}</p>

          {focused.isLeader ? <Crown aria-hidden {...props(styles.crown)} /> : null}

          <div aria-hidden {...props(styles.tokens)}>
            {TOKEN_SLOTS.map((slot, index) => {
              const tokenUrl = focusedRegalia?.tokenUrls[index]

              return tokenUrl ? (
                <img key={slot} alt="" src={tokenUrl} {...props(styles.token)} />
              ) : (
                <span key={slot} {...props(styles.token, styles.emptyToken)} />
              )
            })}
          </div>

          {showRoles ? (
            <div {...props(styles.roles)}>
              <LobbyRoleTile
                priority="primary"
                role={focused.firstPositionPreference}
                onClick={
                  canEditRoles
                    ? () => {
                        onEditRoles?.('first')
                      }
                    : undefined
                }
              />

              {focused.firstPositionPreference === 'FILL' ? null : (
                <LobbyRoleTile
                  priority="secondary"
                  role={focused.secondPositionPreference}
                  onClick={
                    canEditRoles
                      ? () => {
                          onEditRoles?.('second')
                        }
                      : undefined
                  }
                />
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
  // As in the client, only the banner's lower part shows: its ornament at the party's bottom, its top fading out behind the
  // Title. The frame is a screen tall from the party's bottom, so the fade sits under the title on any phone
  banner: {
    animationDuration: '300ms',
    animationName: fadeIn,
    animationTimingFunction: 'ease-out',
    bottom: 0,
    left: 0,
    maxWidth: 'none',
    position: 'absolute',
    width: '100%',
  },
  // Behind the title and the top bar, which come before the party
  bannerFrame: {
    bottom: 0,
    height: '100dvh',
    left: '50%',
    maskImage: 'linear-gradient(transparent 80px, black 260px)',
    pointerEvents: 'none',
    position: 'absolute',
    transform: 'translateX(-50%)',
    width: BANNER_WIDTH,
    zIndex: -1,
  },
  bottom: {
    marginBlockStart: 'clamp(12px, 8dvh - 41px, 32px)',
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
  emptyToken: {
    borderColor: color.primary,
    borderRadius: '50%',
    borderStyle: 'dotted',
    borderWidth: 1,
    boxSizing: 'border-box',
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
  // Wider than the Figma's 112px avatar frame, so a long Riot name breaks between words, not inside one; two lines at most
  name: {
    WebkitBoxOrient: 'vertical',
    WebkitLineClamp: 2,
    color: color.text,
    display: '-webkit-box',
    margin: 0,
    overflow: 'hidden',
    overflowWrap: 'anywhere',
    textAlign: 'center',
    width: 200,
  },
  // eslint-disable-next-line arrow-body-style -- StyleX only compiles dynamic styles written as (x) => ({ ... })
  offset: (x: number) => ({ transform: `translateX(${x}px)` }),
  party: {
    alignItems: 'center',
    display: 'flex',
    flexDirection: 'column',
    flexGrow: 1,
    // Figma: 81px under the title at 917px tall. The gaps shrink toward their minimum at 667px, so a short phone still shows the
    // Queue timer
    marginBlockStart: 'clamp(16px, 9dvh, 81px)',
    minHeight: 0,
    // Clips the row's off-screen slots, not the banner rising behind the title
    overflowX: 'clip',
    position: 'relative',
  },
  roles: {
    display: 'flex',
    gap: 16,
    marginBlockStart: 'clamp(12px, 4.8dvh - 20px, 24px)',
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
  // A leader off the banner wears the crown under their avatar
  slotCrown: {
    left: '50%',
    position: 'absolute',
    top: AVATAR_SIZE + 9,
    transform: 'translateX(-50%)',
  },
  // Figma: three 40px places 134px under the avatar, 24 above the roles
  token: {
    height: 40,
    width: 40,
  },
  tokens: {
    display: 'flex',
    gap: 19,
    marginBlockStart: 'clamp(24px, 25.6dvh - 147px, 88px)',
  },
})
