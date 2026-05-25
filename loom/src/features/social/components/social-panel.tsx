import { type FormEvent, useMemo, useState } from 'react'

import { useQuery } from '@tanstack/react-query'

import { useLatestDdragonVersion } from '@/core/http/ddragon-client'
import { createLcuQueryOptions, currentSummonerDescriptor } from '@/core/lcu/lcu-queries'
import { useSharedLCUTransport } from '@/core/relay/relay-client-provider'
import { relayStoreSelectors, useRelayStore } from '@/core/state/relay-store'

import { useChatLCU } from '../hooks/use-chat-lcu'
import { useInviteFriendToLobby } from '../hooks/use-invite-friend'
import { useSendChatMessage } from '../hooks/use-send-chat-message'
import { useSocialLCU } from '../hooks/use-social-lcu'
import { groupFriends } from '../lib/group-friends'
import { useSocialStore } from '../social-store'
import { socialPanelStyles } from '../social-styles'

import { ChatPanel } from './chat-panel'
import { FriendsList } from './friends-list'
import { SocialPanelHeader } from './social-panel-header'
import { SocialSkeleton } from './social-skeleton'
import { SocialTabBar } from './social-tab-bar'
import { readCurrentUserPuuid } from './social-utils'

import type { Friend, SocialChatMessage, SocialTab } from '../social-types'
import type { Puuid } from '@/core/types/branded'

export function SocialPanel() {
  const styles = socialPanelStyles()
  const socialLCU = useSocialLCU()
  const versionQuery = useLatestDdragonVersion()
  const inviteFriendToLobbyMutation = useInviteFriendToLobby()
  const relayStatus = useRelayStore(relayStoreSelectors.status)
  const selectedFriendId = useSocialStore((state) => {
    return state.selectedFriendId
  })
  const inviteError = useSocialStore((state) => {
    return state.error
  })
  const selectFriend = useSocialStore((state) => {
    return state.selectFriend
  })
  const inviteToLobby = useSocialStore((state) => {
    return state.inviteToLobby
  })
  const showOfflineGroup = useSocialStore((state) => {
    return state.showOfflineGroup
  })
  const toggleShowOfflineGroup = useSocialStore((state) => {
    return state.toggleShowOfflineGroup
  })
  const {friends} = socialLCU
  const {groups} = socialLCU
  const {isLoading} = socialLCU
  const error = socialLCU.error ?? inviteError

  const chatLCU = useChatLCU(selectedFriendId)
  const sendMessageMutation = useSendChatMessage()
  const transport = useSharedLCUTransport()
  const currentSummonerQuery = useQuery(createLcuQueryOptions(currentSummonerDescriptor, transport))
  const currentUserPuuid = readCurrentUserPuuid(currentSummonerQuery.data)

  const [activeTab, setActiveTab] = useState<SocialTab>('friends')
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set())
  const [draftMessage, setDraftMessage] = useState('')

  const selectedFriend =
    friends.find((friend) => {
      return friend.id === selectedFriendId
    }) ?? null
  const selectedMessages = useMemo<SocialChatMessage[]>(() => {
    const msgs = chatLCU.messages
    const unique = [...new Map(msgs.map((m) => {
	return [m.id, m];
})).values()]

    unique.sort((a, b) => {
      return b.timestamp - a.timestamp
    })

    return unique.map((msg) => {
      const sender = friends.find((f) => {
        return f.id === msg.fromPuuid
      })

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

  const groupedFriends = useMemo(() => {
    return groupFriends(friends, groups, showOfflineGroup)
  }, [friends, groups, showOfflineGroup])
  const isDisconnected = relayStatus !== 'connected'
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

  const handleSendMessage = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const text = draftMessage.trim()
    const conversation = selectedFriendId ? chatLCU.getConversationForFriend(selectedFriendId, selectedFriend?.name) : undefined

    if (!selectedFriendId || text.length === 0 || !conversation) {
      return
    }

    sendMessageMutation.mutate({ body: text, conversationId: conversation.id })
    setDraftMessage('')
  }

  let content = <SocialSkeleton />

  if (!isLoading && activeTab === 'friends') {
    content = (
        <div className='h-full min-h-0 overflow-y-auto p-3'>
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
    )
  }

  if (!isLoading && activeTab !== 'friends') {
    content = (
        <ChatPanel
          selectedFriend={selectedFriend}
          ddragonVersion={ddragonVersion}
          hasConversation={Boolean(
            selectedFriendId && chatLCU.getConversationForFriend(selectedFriendId, selectedFriend?.name),
          )}
          selectedMessages={selectedMessages}
          draftMessage={draftMessage}
          setDraftMessage={setDraftMessage}
          handleSendMessage={handleSendMessage}
          isSending={sendMessageMutation.isPending}
        />
    )
  }

  let errorBanner = null

  if (error) {
    errorBanner = (
      <div className={styles.error()} aria-live='polite'>
        {error}
      </div>
    )
  }

  return (
    <section className={styles.root()}>
      <header className={styles.header()}>
        <SocialPanelHeader
          isDisconnected={isDisconnected}
          showOfflineGroup={showOfflineGroup}
          toggleShowOfflineGroup={toggleShowOfflineGroup}
        />

        <SocialTabBar activeTab={activeTab} setActiveTab={setActiveTab} />
      </header>

      {errorBanner}

      <div className={styles.content()}>{content}</div>
    </section>
  )
}
