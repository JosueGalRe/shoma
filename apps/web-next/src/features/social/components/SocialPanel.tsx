import { useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'

import { useLatestDdragonVersion } from '@/core/http/ddragon-client'
import { createLcuQueryOptions, currentSummonerDescriptor } from '@/core/lcu/lcu-queries'
import { useSharedLCUTransport } from '@/core/rift/rift-client-provider'
import { useRiftStore } from '@/core/state/rift-store'
import type { Puuid } from '@/core/types/branded'

import { useChatLCU } from '../hooks/use-chat-lcu'
import { useInviteFriendToLobby } from '../hooks/use-invite-friend'
import { useSendChatMessage } from '../hooks/use-send-chat-message'
import { useSocialLCU } from '../hooks/use-social-lcu'
import { useSocialStore } from '../social-store'
import { groupFriends } from '../lib/group-friends'
import type { Friend } from '../lib/group-friends'

import { ChatPanel } from './chat-panel'
import { FriendsList } from './friends-list'
import { SocialPanelHeader } from './social-panel-header'
import { SocialSkeleton } from './social-skeleton'
import { SocialTabBar, type SocialTab } from './social-tab-bar'

export function SocialPanel() {
  const socialLCU = useSocialLCU()
  const versionQuery = useLatestDdragonVersion()
  const inviteFriendToLobbyMutation = useInviteFriendToLobby()
  const riftStatus = useRiftStore((state) => state.status)
  const selectedFriendId = useSocialStore((state) => state.selectedFriendId)
  const inviteError = useSocialStore((state) => state.error)
  const selectFriend = useSocialStore((state) => state.selectFriend)
  const inviteToLobby = useSocialStore((state) => state.inviteToLobby)
  const showOfflineGroup = useSocialStore((state) => state.showOfflineGroup)
  const toggleShowOfflineGroup = useSocialStore((state) => state.toggleShowOfflineGroup)
  const friends = socialLCU.friends
  const groups = socialLCU.groups
  const isLoading = socialLCU.isLoading
  const error = socialLCU.error ?? inviteError

  const chatLCU = useChatLCU(selectedFriendId)
  const sendMessageMutation = useSendChatMessage()
  const transport = useSharedLCUTransport()
  const currentSummonerQuery = useQuery(createLcuQueryOptions(currentSummonerDescriptor, transport))
  const currentUserPuuid = (currentSummonerQuery.data as Record<string, unknown> | undefined)?.puuid as string | undefined

  const [activeTab, setActiveTab] = useState<SocialTab>('friends')
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set())
  const [draftMessage, setDraftMessage] = useState('')

  const selectedFriend = friends.find((friend) => friend.id === selectedFriendId) ?? null
  const selectedMessages = useMemo(() => {
    const msgs = chatLCU.messages
    const unique = Array.from(new Map(msgs.map((m) => [m.id, m])).values())
    unique.sort((a, b) => b.timestamp - a.timestamp)
    return unique.map((msg) => {
      const sender = friends.find((f) => f.id === msg.fromPuuid)
      return {
        friendId: msg.fromPuuid,
        id: msg.id,
        isOutgoing: msg.fromPuuid === currentUserPuuid,
        senderName: sender?.name,
        text: msg.body,
        timestamp: msg.timestamp,
        type: msg.type,
      }
    })
  }, [chatLCU.messages, currentUserPuuid, friends])

  const groupedFriends = useMemo(() => groupFriends(friends, groups, showOfflineGroup), [friends, groups, showOfflineGroup])
  const isDisconnected = riftStatus !== 'connected'
  const ddragonVersion = versionQuery.data

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

  const handleSelectFriend = (friendId: Puuid) => {
    selectFriend(friendId)
    setActiveTab('chat')
  }

  const handleInvite = (friend: Friend) => {
    inviteToLobby(friend)
  }

  const handleSendMessage = (event: { preventDefault: () => void }) => {
    event.preventDefault()

    const text = draftMessage.trim()
    const conversation = selectedFriendId ? chatLCU.getConversationForFriend(selectedFriendId, selectedFriend?.name) : undefined
    if (!selectedFriendId || text.length === 0 || !conversation) {
      return
    }

    sendMessageMutation.mutate({ conversationId: conversation.id, body: text })
    setDraftMessage('')
  }

  return (
    <section className="flex h-full min-h-[28rem] flex-col overflow-hidden rounded-sm border border-lol-border-subtle bg-lol-navy-950/95 shadow-lol-shadow-md">
      <header className="border-b border-lol-border-subtle bg-lol-navy-900/90 p-4">
        <SocialPanelHeader
          isDisconnected={isDisconnected}
          showOfflineGroup={showOfflineGroup}
          toggleShowOfflineGroup={toggleShowOfflineGroup}
        />
        <SocialTabBar activeTab={activeTab} setActiveTab={setActiveTab} />
      </header>

      {error ? (
        <div className="border-b border-red-500/30 bg-red-950/40 px-4 py-3 text-sm text-red-200" aria-live="polite">{error}</div>
      ) : null}

      <div className="min-h-0 flex-1 overflow-hidden">
        {isLoading ? (
          <SocialSkeleton />
        ) : activeTab === 'friends' ? (
          <div className="h-full min-h-0 overflow-y-auto p-3">
            <FriendsList
              friends={friends}
              groupedFriends={groupedFriends}
              collapsedGroups={collapsedGroups}
              handleToggleGroup={handleToggleGroup}
              selectedFriendId={selectedFriendId}
              handleSelectFriend={handleSelectFriend}
              handleInvite={handleInvite}
              isDisconnected={isDisconnected}
              isInviting={inviteFriendToLobbyMutation.isPending}
              ddragonVersion={ddragonVersion}
            />
          </div>
        ) : (
          <ChatPanel
            selectedFriend={selectedFriend}
            ddragonVersion={ddragonVersion}
            hasConversation={!!(selectedFriendId && chatLCU.getConversationForFriend(selectedFriendId, selectedFriend?.name))}
            selectedMessages={selectedMessages}
            draftMessage={draftMessage}
            setDraftMessage={setDraftMessage}
            handleSendMessage={handleSendMessage}
            isSending={sendMessageMutation.isPending}
          />
        )}
      </div>
    </section>
  )
}
