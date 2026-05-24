import type { FormEvent } from 'react'

import type { Puuid as PuuidType } from '@/core/types/branded';
import type { SummonerId as SummonerIdType } from '@/core/types/branded';

export type FriendStatus = 'online' | 'away' | 'offline'

export const friendStatuses: FriendStatus[] = ['online', 'away', 'offline']

export type Friend = {
  group: string
  iconId?: number
  id: PuuidType
  name: string
  status: FriendStatus
  summonerId: SummonerIdType
}

export type ChatMessage = {
  conversationId?: string
  friendId: PuuidType
  id: string
  isOutgoing: boolean
  lcuId?: string
  text: string
  timestamp: number
}

export type SocialStoreState = {
  error: string | null
  messages: ChatMessage[]
  selectedFriendId: PuuidType | null
  showOfflineGroup: boolean
}

export type SocialStoreActions = {
  addMessage: (message: ChatMessage) => void
  clearMessages: () => void
  inviteToLobby: (friend: Friend) => void
  selectFriend: (friendId: PuuidType | null) => void
  setError: (error: string | null) => void
  setShowOfflineGroup: (value: boolean) => void
  toggleShowOfflineGroup: () => void
}

export type SocialStore = SocialStoreState & SocialStoreActions

export type SocialTab = 'friends' | 'chat'

export type SocialChatMessage = {
  friendId: string
  id: string
  isOutgoing: boolean
  senderName?: string
  text: string
  timestamp: number
  type: string
}

export type SocialTabBarProps = {
  activeTab: SocialTab
  setActiveTab: (tab: SocialTab) => void
}

export type SocialPanelHeaderProps = {
  isDisconnected: boolean
  showOfflineGroup: boolean
  toggleShowOfflineGroup: () => void
}

export type FriendsListGroup = [string, Friend[]]

export type FriendsListProps = {
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
}

export type ChatPanelProps = {
  selectedFriend: Friend | null
  ddragonVersion: string | undefined
  hasConversation: boolean
  selectedMessages: SocialChatMessage[]
  draftMessage: string
  setDraftMessage: (message: string) => void
  handleSendMessage: (event: FormEvent<HTMLFormElement>) => void
  isSending: boolean
}
