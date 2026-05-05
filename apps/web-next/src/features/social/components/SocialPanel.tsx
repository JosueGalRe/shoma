import { ChevronDown, MessageSquare, Send, UsersRound, WifiOff } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Avatar, Button, Input } from '@/components/ui'
import { useLatestDdragonVersion } from '@/core/http/ddragon-client'
import { useRiftStore } from '@/core/state/rift-store'
import { cn } from '@/lib/utils'

import { useInviteFriendToLobby } from '../hooks/use-invite-friend'
import { useSocialLCU } from '../hooks/use-social-lcu'
import { Friend, FriendStatus, useSocialStore } from '../social-store'

type SocialTab = 'friends' | 'chat'

function useTranslatedStatusLabels() {
  const { t } = useTranslation()
  return {
    away: t('social.status.away'),
    offline: t('social.status.offline'),
    online: t('social.status.online'),
  }
}

function translateGroupName(group: string, t: (key: string) => string): string {
  const cleaned = group.replace(/^\*+/, '').trim()
  const normalized = cleaned.toUpperCase()
  if (normalized === 'DEFAULT' || normalized === 'GENERAL') {
    return t('social.group.default')
  }
  return cleaned
}

const statusDotClasses: Record<FriendStatus, string> = {
  away: 'bg-yellow-400 shadow-[0_0_8px_rgba(250,204,21,0.45)]',
  offline: 'bg-lol-text-muted',
  online: 'bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.45)]',
}

function profileIconUrl(version: string | undefined, iconId?: number): string | undefined {
  if (!version || iconId === undefined) {
    return undefined
  }

  return `https://ddragon.leagueoflegends.com/cdn/${version}/img/profileicon/${iconId}.png`
}

function formatMessageTime(timestamp: number): string {
  return new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  }).format(timestamp)
}

function groupFriends(friends: Friend[], groups: string[]): Array<[string, Friend[]]> {
  const fallbackGroups = [...new Set(friends.map((friend) => friend.group))]
  const orderedGroups = groups.length > 0 ? groups : fallbackGroups

  return orderedGroups.map((group) => [
    group,
    friends.filter((friend) => friend.group === group),
  ])
}

export function SocialPanel() {
  const { t } = useTranslation()
  const socialLCU = useSocialLCU()
  const versionQuery = useLatestDdragonVersion()
  const inviteFriendToLobbyMutation = useInviteFriendToLobby()
  const riftStatus = useRiftStore((state) => state.status)
  const selectedFriendId = useSocialStore((state) => state.selectedFriendId)
  const messages = useSocialStore((state) => state.messages)
  const inviteError = useSocialStore((state) => state.error)
  const selectFriend = useSocialStore((state) => state.selectFriend)
  const addMessage = useSocialStore((state) => state.addMessage)
  const inviteToLobby = useSocialStore((state) => state.inviteToLobby)
  const friends = socialLCU.friends
  const groups = socialLCU.groups
  const isLoading = socialLCU.isLoading
  const error = socialLCU.error ?? inviteError

  const [activeTab, setActiveTab] = useState<SocialTab>('friends')
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set())
  const [draftMessage, setDraftMessage] = useState('')

  const selectedFriend = friends.find((friend) => friend.id === selectedFriendId) ?? null
  const selectedMessages = messages.filter((message) => message.friendId === selectedFriendId)
  const groupedFriends = useMemo(() => groupFriends(friends, groups), [friends, groups])
  const isDisconnected = riftStatus !== 'connected'
  const ddragonVersion = versionQuery.data
  const statusLabels = useTranslatedStatusLabels()

  const handleToggleGroup = (group: string) => {
    setCollapsedGroups((currentGroups) => {
      const nextGroups = new Set(currentGroups)

      if (nextGroups.has(group)) {
        nextGroups.delete(group)
      } else {
        nextGroups.add(group)
      }

      return nextGroups
    })
  }

  const handleSelectFriend = (friendId: string) => {
    selectFriend(friendId)
    setActiveTab('chat')
  }

  const handleInvite = (friend: Friend) => {
    inviteToLobby(friend)
  }

  const handleSendMessage = (event: { preventDefault: () => void }) => {
    event.preventDefault()

    const text = draftMessage.trim()
    if (!selectedFriendId || text.length === 0) {
      return
    }

    addMessage({
      friendId: selectedFriendId,
      id: `message-${selectedFriendId}-${Date.now()}`,
      isOutgoing: true,
      text,
      timestamp: Date.now(),
    })
    setDraftMessage('')
  }

  return (
    <section className="flex h-full min-h-[28rem] flex-col overflow-hidden rounded-sm border border-lol-border-subtle bg-lol-navy-950/95 shadow-lol-shadow-md">
      <header className="border-b border-lol-border-subtle bg-lol-navy-900/90 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.24em] text-lol-text-muted">Mimic</p>
            <h2 className="font-display text-lg tracking-wider text-lol-gold">Social</h2>
          </div>

          <div
            className={cn(
              'inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-xs font-medium',
              isDisconnected
                ? 'border-yellow-500/30 bg-yellow-500/10 text-yellow-300'
                : 'border-green-500/30 bg-green-500/10 text-green-300'
            )}
          >
            <span className={cn('h-2 w-2 rounded-full', isDisconnected ? 'bg-yellow-400' : 'bg-green-400')} />
            {isDisconnected ? 'Offline' : 'Online'}
          </div>
        </div>

        {isDisconnected ? (
          <div className="mt-3 flex items-center gap-2 rounded-sm border border-lol-border-subtle bg-lol-navy-950/80 px-3 py-2 text-xs text-lol-text-secondary">
            <WifiOff className="h-3.5 w-3.5 text-yellow-300" aria-hidden="true" />
            Social is using mock data until the client reconnects.
          </div>
        ) : null}

        <div className="mt-4 grid grid-cols-2 gap-2" role="tablist" aria-label="Social sections">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'friends'}
            onClick={() => setActiveTab('friends')}
            className={cn(
              'inline-flex items-center justify-center gap-2 rounded-sm border px-3 py-2 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lol-border-gold',
              activeTab === 'friends'
                ? 'border-lol-border-gold bg-lol-navy-800 text-lol-gold shadow-lol-glow-gold'
                : 'border-lol-border-subtle text-lol-text-secondary hover:text-lol-text-primary'
            )}
          >
            <UsersRound className="h-4 w-4" aria-hidden="true" />
            Friends
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'chat'}
            onClick={() => setActiveTab('chat')}
            className={cn(
              'inline-flex items-center justify-center gap-2 rounded-sm border px-3 py-2 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lol-border-gold',
              activeTab === 'chat'
                ? 'border-lol-border-gold bg-lol-navy-800 text-lol-gold shadow-lol-glow-gold'
                : 'border-lol-border-subtle text-lol-text-secondary hover:text-lol-text-primary'
            )}
          >
            <MessageSquare className="h-4 w-4" aria-hidden="true" />
            Chat
          </button>
        </div>
      </header>

      {error ? (
        <div className="border-b border-red-500/30 bg-red-950/40 px-4 py-3 text-sm text-red-200" aria-live="polite">{error}</div>
      ) : null}

      <div className="min-h-0 flex-1 overflow-hidden">
        {isLoading ? (
          <div className="flex h-full items-center justify-center p-6 text-sm text-lol-text-secondary">Loading friends...</div>
        ) : activeTab === 'friends' ? (
          <div className="h-full min-h-0 overflow-y-auto p-3">
            {friends.length === 0 ? (
              <div className="rounded-sm border border-dashed border-lol-border-subtle bg-lol-navy-900/40 p-5 text-center">
                <div className="font-display text-base text-lol-gold">No friends online</div>
                <p className="mt-2 text-sm text-lol-text-muted">Friends will appear here once social data is available.</p>
              </div>
            ) : (
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
                                    disabled={friend.status === 'offline' || isDisconnected || inviteFriendToLobbyMutation.isPending}
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
            )}
          </div>
        ) : (
          <div className="flex h-full min-h-0 flex-col overflow-hidden">
            <div className="border-b border-lol-border-subtle px-4 py-3">
              {selectedFriend ? (
                <div className="flex items-center gap-3">
                  <Avatar src={profileIconUrl(ddragonVersion, selectedFriend.iconId)} alt={selectedFriend.name} status={selectedFriend.status} size="sm" />
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-lol-text-primary">{selectedFriend.name}</div>
                    <div className="mt-1 flex items-center gap-1.5 text-xs text-lol-text-muted">
                      <span className={cn('h-2 w-2 rounded-full', statusDotClasses[selectedFriend.status])} />
                      {statusLabels[selectedFriend.status]}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-lol-text-muted">Select a friend to start chatting.</div>
              )}
            </div>

            <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
              {!selectedFriend ? (
                <div className="rounded-sm border border-dashed border-lol-border-subtle bg-lol-navy-900/40 p-5 text-center text-sm text-lol-text-muted">
                  Choose a friend from the friends list to open a conversation.
                </div>
              ) : selectedMessages.length === 0 ? (
                <div className="rounded-sm border border-dashed border-lol-border-subtle bg-lol-navy-900/40 p-5 text-center text-sm text-lol-text-muted">
                  No messages yet. Send the first one.
                </div>
              ) : (
                selectedMessages.map((message) => (
                  <div key={message.id} className={cn('flex', message.isOutgoing ? 'justify-end' : 'justify-start')}>
                    <div
                      className={cn(
                        'max-w-[85%] rounded-sm border px-3 py-2 text-sm',
                        message.isOutgoing
                          ? 'border-lol-border-gold bg-lol-navy-800 text-lol-text-primary'
                          : 'border-lol-border-subtle bg-lol-navy-900 text-lol-text-secondary'
                      )}
                    >
                      <p>{message.text}</p>
                      <time className="mt-1 block text-[0.65rem] uppercase tracking-wide text-lol-text-muted">
                        {formatMessageTime(message.timestamp)}
                      </time>
                    </div>
                  </div>
                ))
              )}
            </div>

            <form onSubmit={handleSendMessage} className="flex gap-2 border-t border-lol-border-subtle p-3">
              <Input
                value={draftMessage}
                onChange={(event) => setDraftMessage(event.target.value)}
                placeholder={selectedFriend ? `Message ${selectedFriend.name}` : 'Select a friend'}
                disabled={!selectedFriend}
                aria-label="Chat message"
              />
              <Button type="submit" size="icon" disabled={!selectedFriend || draftMessage.trim().length === 0} aria-label="Send message">
                <Send className="h-4 w-4" aria-hidden="true" />
              </Button>
            </form>
          </div>
        )}
      </div>
    </section>
  )
}
