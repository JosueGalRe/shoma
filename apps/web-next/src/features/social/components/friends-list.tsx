import { ChevronDown } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Avatar, Button } from '@/components/ui'
import type { Puuid } from '@/core/types/branded'
import { cn } from '@/lib/utils'

import type { Friend } from '../lib/group-friends'
import { profileIconUrl, statusDotClasses, translateGroupName, useTranslatedStatusLabels } from './social-utils'

interface FriendsListProps {
  friends: Friend[]
  groupedFriends: [string, Friend[]][]
  collapsedGroups: Set<string>
  handleToggleGroup: (group: string) => void
  selectedFriendId: Puuid | null
  handleSelectFriend: (friendId: Puuid) => void
  handleInvite: (friend: Friend) => void
  isDisconnected: boolean
  isInviting: boolean
  ddragonVersion: string | undefined
}

export function FriendsList({
  friends,
  groupedFriends,
  collapsedGroups,
  handleToggleGroup,
  selectedFriendId,
  handleSelectFriend,
  handleInvite,
  isDisconnected,
  isInviting,
  ddragonVersion,
}: FriendsListProps) {
  const { t } = useTranslation()
  const statusLabels = useTranslatedStatusLabels()

  if (friends.length === 0) {
    return (
      <div className="rounded-sm border border-dashed border-lol-border-subtle bg-lol-navy-900/40 p-5 text-center">
        <div className="font-display text-base text-lol-gold">No friends online</div>
        <p className="mt-2 text-sm text-lol-text-muted">Friends will appear here once social data is available.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {groupedFriends.map(([group, groupFriends]) => {
        const isCollapsed = collapsedGroups.has(group)

        return (
          <div key={group} className="rounded-sm border border-lol-border-subtle bg-lol-navy-900/40">
            <button
              type="button"
              aria-controls={`social-group-${group}`}
              aria-expanded={!isCollapsed}
              onClick={() => handleToggleGroup(group)}
              className="flex w-full items-center justify-between px-3 py-2 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lol-border-gold"
            >
              <span className="font-display text-sm tracking-wider text-lol-gold">{translateGroupName(group, t)}</span>
              <span className="inline-flex items-center gap-2 text-xs text-lol-text-muted">
                {groupFriends.length}
                <ChevronDown
                  className={cn('h-4 w-4 transition-transform', isCollapsed ? '-rotate-90' : 'rotate-0')}
                  aria-hidden="true"
                />
              </span>
            </button>

            {isCollapsed ? null : (
              <div className="border-t border-lol-border-subtle p-2" id={`social-group-${group}`}>
                {groupFriends.length === 0 ? (
                  <p className="px-2 py-3 text-sm text-lol-text-muted">No friends in this group.</p>
                ) : (
                  <div className="space-y-2">
                    {groupFriends.map((friend) => (
                      <div
                        key={friend.id}
                        className={cn(
                          'flex items-center gap-3 rounded-sm border px-2 py-2 transition-colors duration-150',
                          selectedFriendId === friend.id
                            ? 'border-lol-border-gold bg-lol-navy-800/70'
                            : 'border-transparent hover:border-lol-border-subtle hover:bg-lol-navy-800/40'
                        )}
                      >
                        <button
                          type="button"
                          onClick={() => handleSelectFriend(friend.id)}
                          className="flex min-w-0 flex-1 items-center gap-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lol-border-gold"
                        >
                          <Avatar src={profileIconUrl(ddragonVersion, friend.iconId)} alt={friend.name} status={friend.status} size="sm" />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-medium text-lol-text-primary">{friend.name}</span>
                            <span className="mt-1 flex items-center gap-1.5 text-xs text-lol-text-muted">
                              <span className={cn('h-2 w-2 rounded-full', statusDotClasses[friend.status])} />
                              {statusLabels[friend.status]}
                            </span>
                          </span>
                        </button>

                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={() => handleInvite(friend)}
                          disabled={friend.status === 'offline' || isDisconnected || isInviting}
                          className="h-11 min-w-11 px-2 text-xs sm:h-8 sm:min-w-0"
                        >
                          Invite
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
