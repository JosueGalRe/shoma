import { useState } from 'react'

import { LcuPaths } from '@shoma/protocol-contract'
import { useQueries, useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'

import { Avatar, Button, Input, ScrollArea } from '@/components/ui'
import { useChampions, useLatestDdragonVersion } from '@/core/http/ddragon-client'
import { createLcuQueryOptions, recentPlayersDescriptor } from '@/core/lcu/lcu-queries'
import { readDisplayName } from '@/core/lcu/parsers/lobby'
import { useSharedLCUTransport } from '@/core/relay/use-relay-state'
import { SummonerId } from '@/core/types/branded'
import { isFriendInvitable, profileIconUrl } from '@/features/social/components/social-utils'
import { useSocialLCU } from '@/features/social/hooks/use-social-lcu'
import { resolveChampionIcon } from '@/lib/asset-resolver'

import { inviteOverlayStyles } from './invite-overlay-styles'
import { parseSuggestedPlayers } from './invite-overlay-utils'
import { InvitePlayerRow } from './invite-player-row'

import type { InviteOverlayProps } from './invite-overlay-types'

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
  const transport = useSharedLCUTransport()
  const versionQuery = useLatestDdragonVersion()
  const ddragonVersion = versionQuery.data
  const { data: champions } = useChampions()
  const suggestedPlayersQuery = useQuery({
    ...createLcuQueryOptions(recentPlayersDescriptor, transport),
    select: parseSuggestedPlayers,
  })
  const friendIds = new Set(
    friends.map((friend) => {
      return Number(friend.summonerId)
    }),
  )
  const suggestedPlayers = (suggestedPlayersQuery.data ?? []).flatMap((player) => {
    if (excludeSummonerIds.has(player.summonerId) || friendIds.has(player.summonerId)) {
      return []
    }

    return [player]
  })
  const unknownNameIds = suggestedPlayers.flatMap((player) => {
    return player.summonerName === 'Unknown summoner' ? [player.summonerId] : []
  })
  const nameQueries = useQueries({
    queries: unknownNameIds.map((summonerId) => {
      return {
        ...createLcuQueryOptions(
          {
            parse: (content: unknown) => {
              return readDisplayName(content)
            },
            path: LcuPaths.summoner.summoner(summonerId),
            queryKey: ['lcu', 'summoner', 'by-id', summonerId] as const,
          },
          transport,
        ),
      }
    }),
  })
  const resolvedNames = new Map(
    unknownNameIds.flatMap((summonerId, index) => {
      const name = nameQueries[index]?.data

      return name && name !== 'Unknown summoner' ? [[summonerId, name] as const] : []
    }),
  )
  const displaySuggestedPlayers = suggestedPlayers.map((player) => {
    return { ...player, summonerName: resolvedNames.get(player.summonerId) ?? player.summonerName }
  })

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

  const togglePlayer = (id: number) => {
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
          className={styles.filterInput()}
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

          <ScrollArea className="max-h-56" viewportClassName="pr-2">
            {availableFriends.length === 0 ? (
              <p className={styles.permission()}>{t('lobby.noAvailablePlayers')}</p>
            ) : (
              <ul className="space-y-2">
                {availableFriends.map((friend) => {
                  const summonerId = Number(friend.summonerId)

                  return (
                    <li key={friend.id}>
                      <InvitePlayerRow
                        disabled={isDisabled}
                        icon={
                          <Avatar
                            alt={friend.name}
                            size="sm"
                            src={profileIconUrl(ddragonVersion, friend.iconId)}
                            status={friend.status}
                          />
                        }
                        name={friend.name}
                        onToggle={() => {
                          togglePlayer(summonerId)
                        }}
                        selected={selectedIds.has(summonerId)}
                      />
                    </li>
                  )
                })}
              </ul>
            )}
          </ScrollArea>
        </div>

        {suggestedPlayers.length > 0 ? (
          <div>
            <h3 className={styles.sectionTitle()}>{t('lobby.suggestedPlayers')}</h3>

            <ScrollArea className="max-h-60" viewportClassName="pr-2">
              <ul className="space-y-2">
                {displaySuggestedPlayers.map((player) => {
                  return (
                    <li key={player.summonerId}>
                      <InvitePlayerRow
                        disabled={isDisabled}
                        icon={
                          player.championId !== undefined && champions ? (
                            <Avatar
                              alt={player.summonerName}
                              size="sm"
                              src={resolveChampionIcon(player.championId, champions, ddragonVersion)}
                            />
                          ) : null
                        }
                        name={player.summonerName}
                        onToggle={() => {
                          togglePlayer(player.summonerId)
                        }}
                        selected={selectedIds.has(player.summonerId)}
                      />
                    </li>
                  )
                })}
              </ul>
            </ScrollArea>
          </div>
        ) : null}

        <Button
          className={styles.sendButton()}
          disabled={isDisabled || selectedIds.size === 0}
          onClick={handleSend}
          variant="primary"
        >
          {t('lobby.inviteOverlay.send')}
        </Button>
      </div>
    </div>
  )
}
