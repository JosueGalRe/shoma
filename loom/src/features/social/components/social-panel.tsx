import { type FormEvent, useEffect, useState } from 'react'

import { AmbientBackground } from '@/components/ui/ambient-background'
import { relayStoreSelectors, useRelayStore } from '@/core/state/relay-store'

import { useInviteFriendToLobby } from '../hooks/use-invite-friend'
import { useSendChatMessage } from '../hooks/use-send-chat-message'
import { useSocialPanelData } from '../hooks/use-social-panel-data'
import { filterFriendsByQuery, groupFriends } from '../lib/group-friends'
import { useSocialStore } from '../social-store'
import { socialPanelStyles } from '../social-styles'

import { SocialChatTab } from './social-chat-tab'
import { SocialFriendsTab } from './social-friends-tab'
import { SocialPanelHeader } from './social-panel-header'
import { SocialSkeleton } from './social-skeleton'
import { SocialTabBar } from './social-tab-bar'

import type { ConversationListItem, Friend, SocialPanelProps, SocialTab } from '../social-types'
import type { Puuid } from '@/core/types/branded'

export function SocialPanel({ variant = 'card' }: SocialPanelProps) {
  const styles = socialPanelStyles()
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
  const selectedConversationId = useSocialStore((state) => {
    return state.selectedConversationId
  })
  const selectConversation = useSocialStore((state) => {
    return state.selectConversation
  })
  const inviteToLobby = useSocialStore((state) => {
    return state.inviteToLobby
  })
  const setError = useSocialStore((state) => {
    return state.setError
  })
  const showOfflineGroup = useSocialStore((state) => {
    return state.showOfflineGroup
  })
  const toggleShowOfflineGroup = useSocialStore((state) => {
    return state.toggleShowOfflineGroup
  })

  const {
    chatLCU,
    conversationItems,
    conversationTitle,
    ddragonVersion,
    error: socialError,
    friends,
    groups,
    isLoading,
    selectedFriend,
    selectedMessages,
    sentInviteStates,
    totalUnread,
    unreadCounts,
  } = useSocialPanelData(selectedFriendId, selectedConversationId)

  const error = socialError ?? inviteError
  const sendMessageMutation = useSendChatMessage()

  useEffect(() => {
    if (!error) {
      return undefined
    }

    const timer = setTimeout(() => {
      setError(null)
    }, 6000)

    return () => {
      clearTimeout(timer)
    }
  }, [error, setError])

  const [activeTab, setActiveTab] = useState<SocialTab>('friends')
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set())
  const [draftMessage, setDraftMessage] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  const visibleFriends = filterFriendsByQuery(friends, searchQuery)
  const groupedFriends = groupFriends(visibleFriends, groups, showOfflineGroup)
  const isDisconnected = relayStatus !== 'connected'

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

  const handleSelectConversation = (item: ConversationListItem) => {
    if (item.friend) {
      selectFriend(item.friend.id)
    } else {
      selectConversation(item.id)
    }
  }

  const handleBackToConversations = () => {
    selectFriend(null)
  }

  const handleInvite = (friend: Friend) => {
    inviteToLobby(friend)
  }

  const handleSendMessage = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const text = draftMessage.trim()
    let conversation: { id: string } | undefined

    if (selectedConversationId) {
      conversation = { id: selectedConversationId }
    } else if (selectedFriendId) {
      conversation = chatLCU.getConversationForFriend(selectedFriendId, selectedFriend?.name)
    }

    if (text.length === 0 || !conversation) {
      return
    }

    sendMessageMutation.mutate({ body: text, conversationId: conversation.id })
    setDraftMessage('')
  }

  let content = <SocialSkeleton />

  if (!isLoading && activeTab === 'friends') {
    content = (
      <SocialFriendsTab
        visibleFriends={visibleFriends}
        unreadCounts={unreadCounts}
        sentInviteStates={sentInviteStates}
        groupedFriends={groupedFriends}
        collapsedGroups={collapsedGroups}
        handleToggleGroup={handleToggleGroup}
        selectedFriendId={selectedFriendId}
        handleSelectFriend={handleSelectFriend}
        handleInvite={handleInvite}
        isDisconnected={isDisconnected}
        isInviting={inviteFriendToLobbyMutation.isPending}
        ddragonVersion={ddragonVersion}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />
    )
  }

  if (!isLoading && activeTab !== 'friends') {
    content = (
      <SocialChatTab
        hasOpenConversation={Boolean(selectedFriendId || selectedConversationId)}
        hasConversation={
          selectedConversationId
            ? true
            : Boolean(selectedFriendId && chatLCU.getConversationForFriend(selectedFriendId, selectedFriend?.name))
        }
        selectedFriend={selectedFriend}
        conversationTitle={conversationTitle}
        ddragonVersion={ddragonVersion}
        onBack={handleBackToConversations}
        selectedMessages={selectedMessages}
        draftMessage={draftMessage}
        setDraftMessage={setDraftMessage}
        handleSendMessage={handleSendMessage}
        isSending={sendMessageMutation.isPending}
        conversationItems={conversationItems}
        handleSelectConversation={handleSelectConversation}
      />
    )
  }

  let errorBanner = null

  if (error) {
    errorBanner = (
      <div className={styles.error()} aria-live="polite">
        {error}
      </div>
    )
  }

  const panelContent = (
    <>
      <header className={styles.header()}>
        <SocialPanelHeader
          isDisconnected={isDisconnected}
          showOfflineGroup={showOfflineGroup}
          toggleShowOfflineGroup={toggleShowOfflineGroup}
        />

        <SocialTabBar activeTab={activeTab} setActiveTab={setActiveTab} unreadCount={totalUnread} />
      </header>

      {errorBanner}

      <div className={styles.content()}>{content}</div>
    </>
  )

  if (variant === 'flush') {
    return <section className={styles.rootFlush()}>{panelContent}</section>
  }

  return (
    <section className={styles.root()}>
      <AmbientBackground>{panelContent}</AmbientBackground>
    </section>
  )
}
