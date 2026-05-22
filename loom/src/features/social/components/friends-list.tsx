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
      <div className='border-border bg-secondary/40 rounded-sm border border-dashed p-5 text-center'>
        <div className='font-display text-primary text-base'>No friends online</div>
        <p className='text-muted mt-2 text-sm'>Friends will appear here once social data is available.</p>
      </div>
    )
  }

  return (
    <div className='space-y-3'>
      {groupedFriends.map(([group, groupFriends]) => {
        const isCollapsed = collapsedGroups.has(group)

        return (
          <div key={group} className='border-border bg-secondary/40 rounded-sm border'>
            <button
              type='button'
              aria-controls={`social-group-${group}`}
              aria-expanded={!isCollapsed}
              onClick={() => handleToggleGroup(group)}
              className='focus-visible:ring-ring flex w-full items-center justify-between px-3 py-2 text-left focus-visible:ring-2 focus-visible:outline-none'
            >
              <span className='font-display text-primary text-sm tracking-wider'>{translateGroupName(group, t)}</span>
              <span className='text-muted inline-flex items-center gap-2 text-xs'>
                {groupFriends.length}
                <ChevronDown
                  className={cn('h-4 w-4 transition-transform', isCollapsed ? '-rotate-90' : 'rotate-0')}
                  aria-hidden='true'
                />
              </span>
            </button>

            {isCollapsed ? null : (
              <div className='border-border border-t p-2' id={`social-group-${group}`}>
                {groupFriends.length === 0 ? (
                  <p className='text-muted px-2 py-3 text-sm'>No friends in this group.</p>
                ) : (
                  <div className='space-y-2'>
                    {groupFriends.map((friend) => (
                      <div
                        key={friend.id}
                        className={cn(
                          'flex items-center gap-3 rounded-sm border px-2 py-2 transition-colors duration-150',
                          selectedFriendId === friend.id
                            ? 'border-primary bg-secondary/70'
                            : 'hover:border-border hover:bg-secondary/40 border-transparent',
                        )}
                      >
                        <button
                          type='button'
                          onClick={() => handleSelectFriend(friend.id)}
                          className='focus-visible:ring-ring flex min-w-0 flex-1 items-center gap-3 text-left focus-visible:ring-2 focus-visible:outline-none'
                        >
                          <Avatar
                            src={profileIconUrl(ddragonVersion, friend.iconId)}
                            alt={friend.name}
                            status={friend.status}
                            size='sm'
                          />
                          <span className='min-w-0 flex-1'>
                            <span className='text-foreground block truncate text-sm font-medium'>{friend.name}</span>
                            <span className='text-muted mt-1 flex items-center gap-1.5 text-xs'>
                              <span className={cn('h-2 w-2 rounded-full', statusDotClasses[friend.status])} />
                              {statusLabels[friend.status]}
                            </span>
                          </span>
                        </button>

                        <Button
                          type='button'
                          variant='secondary'
                          size='sm'
                          onClick={() => handleInvite(friend)}
                          disabled={friend.status === 'offline' || isDisconnected || isInviting}
                          className='h-11 min-w-11 px-2 text-xs sm:h-8 sm:min-w-0'
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
