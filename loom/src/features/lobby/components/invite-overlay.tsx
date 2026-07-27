import { useState } from 'react'

import { useTranslation } from 'react-i18next'

import { Avatar, Button, Input, ScrollArea } from '@/components/ui'
import { SummonerId } from '@/core/types/branded'
import { isFriendInvitable } from '@/features/social/components/social-utils'
import { useSocialLCU } from '@/features/social/hooks/use-social-lcu'

import { inviteOverlayStyles } from './invite-overlay-styles'

import type { InviteOverlayProps } from './invite-overlay-types'
import type { Friend } from '@/features/social/social-types'

export function InviteOverlay({
  canInvite,
  excludeSummonerIds,
  isActionPending,
  isConnected,
  onClose,
  onInvitePlayers,
}: InviteOverlayProps) {
  const { t } = useTranslation()
  const styles = inviteOverlayStyles()
  const { friends } = useSocialLCU()

  const [filter, setFilter] = useState('')
  const [selectedIds, setSelectedIds] = useState<ReadonlySet<number>>(new Set())

  const normalizedFilter = filter.trim().toLowerCase()
  const availableFriends = friends.filter((friend) => {
    if (!isFriendInvitable(friend)) {
      return false
    }

    if (excludeSummonerIds.has(Number(friend.summonerId))) {
      return false
    }

    return normalizedFilter.length === 0 || friend.name.toLowerCase().includes(normalizedFilter)
  })

  const isDisabled = !isConnected || isActionPending || !canInvite

  const toggleFriend = (friend: Friend) => {
    const id = Number(friend.summonerId)

    setSelectedIds((current) => {
      const next = new Set(current)

      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }

      return next
    })
  }

  const handleSend = async () => {
    await onInvitePlayers(
      [...selectedIds].map((id) => {
        return SummonerId(id)
      }),
    )

    onClose()
  }

  return (
    <div className={styles.overlay()}>
      <div className={styles.panel()}>
        <div className={styles.header()}>
          <h2 className={styles.title()}>{t('lobby.inviteOverlay.title')}</h2>

          <button aria-label="Close invite overlay" className={styles.closeButton()} onClick={onClose} type="button">
            <svg className={styles.closeIcon()} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <Input
          aria-label={t('lobby.summonerName')}
          disabled={isDisabled}
          onChange={(event) => {
            setFilter(event.target.value)
          }}
          placeholder={t('lobby.summonerName')}
          type="search"
          value={filter}
        />

        {!canInvite ? <p className={styles.permission()}>{t('lobby.invitePermission')}</p> : null}

        <div>
          <h3 className={styles.sectionTitle()}>{t('lobby.availablePlayers')}</h3>

          <ScrollArea className="max-h-72" viewportClassName="pr-2">
            {availableFriends.length === 0 ? (
              <p className={styles.permission()}>{t('lobby.noAvailablePlayers')}</p>
            ) : (
              <ul className="space-y-2">
                {availableFriends.map((friend) => {
                  const isSelected = selectedIds.has(Number(friend.summonerId))

                  return (
                    <li key={friend.id}>
                      <button
                        type="button"
                        aria-pressed={isSelected}
                        className={styles.friendItem({ selected: isSelected })}
                        disabled={isDisabled}
                        onClick={() => {
                          return toggleFriend(friend)
                        }}
                      >
                        <span className={styles.friendCheckbox({ selected: isSelected })} aria-hidden="true" />

                        <Avatar alt={friend.name} size="sm" status={friend.status} />

                        <span className={styles.suggestionName()}>{friend.name}</span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </ScrollArea>
        </div>

        <Button disabled={isDisabled || selectedIds.size === 0} onClick={handleSend} variant="primary">
          {t('lobby.inviteOverlay.send')}
        </Button>
      </div>
    </div>
  )
}
