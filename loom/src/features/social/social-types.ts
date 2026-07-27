import type { FormEvent } from 'react'

import type { Puuid as PuuidType, SummonerId as SummonerIdType } from '@/core/types/branded'

export type FriendStatus = 'online' | 'away' | 'busy' | 'offline'

export const friendStatuses: FriendStatus[] = ['online', 'away', 'busy', 'offline']

export type FriendActivity = 'in-game' | 'champ-select' | 'in-queue' | 'in-lobby'

export interface Friend {
  activity?: FriendActivity
  gameMode?: string
  group: string
  iconId?: number
  id: PuuidType
  isOnMobile?: boolean
  name: string
  status: FriendStatus
  summonerId: SummonerIdType
}

export interface ChatMessage {
  conversationId?: string
  friendId: PuuidType
  id: string
  isOutgoing: boolean
  lcuId?: string
  text: string
  timestamp: number
}

export interface SocialStoreState {
  error: string | null
  messages: ChatMessage[]
  selectedConversationId: string | null
  selectedFriendId: PuuidType | null
  showOfflineGroup: boolean
}

export interface SocialStoreActions {
  addMessage: (message: ChatMessage) => void
  clearMessages: () => void
  inviteToLobby: (friend: Friend) => void
  selectConversation: (conversationId: string | null) => void
  selectFriend: (friendId: PuuidType | null) => void
  setError: (error: string | null) => void
  setShowOfflineGroup: (value: boolean) => void
  toggleShowOfflineGroup: () => void
}

export type SocialStore = SocialStoreState & SocialStoreActions

export type SocialTab = 'friends' | 'chat'

export interface SocialChatMessage {
  friendId: string
  id: string
  isOutgoing: boolean
  senderIconId?: number
  senderName?: string
  text: string
  timestamp: number
  type: string
}

export interface SocialTabBarProps {
  activeTab: SocialTab
  setActiveTab: (tab: SocialTab) => void
  unreadCount: number
}

export interface SocialPanelHeaderProps {
  isDisconnected: boolean
  showOfflineGroup: boolean
  toggleShowOfflineGroup: () => void
}

export type FriendsListGroup = [string, Friend[]]

export interface FriendsListProps {
  friends: Friend[]
  groupedFriends: FriendsListGroup[]
  collapsedGroups: Set<string>
  handleToggleGroup: (group: string) => void
  selectedFriendId: PuuidType | null
  handleSelectFriend: (friendId: PuuidType) => void
  handleInvite: (friend: Friend) => void
  isDisconnected: boolean
  isInviting: boolean
  ddragonVersion: string | undefined
  sentInviteStates: ReadonlyMap<SummonerIdType, string>
  unreadCounts: ReadonlyMap<PuuidType, number>
}

export interface ChatPanelProps {
  selectedFriend: Friend | null
  conversationTitle?: string
  ddragonVersion: string | undefined
  hasConversation: boolean
  onBack?: () => void
  selectedMessages: SocialChatMessage[]
  draftMessage: string
  setDraftMessage: (message: string) => void
  handleSendMessage: (event: FormEvent<HTMLFormElement>) => void
  isSending: boolean
}

export interface ConversationListItem {
  friend?: Friend
  id: string
  lastMessage?: string
  lastMessageSenderName?: string
  lastMessageTimestamp?: number
  title: string
  unreadCount: number
}

export interface ConversationsListProps {
  conversations: ConversationListItem[]
  handleSelectConversation: (item: ConversationListItem) => void
  ddragonVersion: string | undefined
}
