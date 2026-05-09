import { create } from 'zustand'

import { useSettingsStore } from '@/core/state/settings-store'
import { type Puuid as PuuidType, type SummonerId as SummonerIdType } from '@/core/types/branded'

// @knip
export const friendStatuses = ['online', 'away', 'offline'] as const
export type FriendStatus = (typeof friendStatuses)[number]

export type Friend = {
  group: string
  iconId?: number
  id: PuuidType
  name: string
  status: FriendStatus
  summonerId: SummonerIdType
}

// @knip
export type ChatMessage = {
  conversationId?: string
  friendId: PuuidType
  id: string
  isOutgoing: boolean
  lcuId?: string
  text: string
  timestamp: number
}

// @knip
export type SocialStoreState = {
  error: string | null
  /** Local message cache — transitional until full LCU chat integration. */
  messages: ChatMessage[]
  selectedFriendId: PuuidType | null
  showOfflineGroup: boolean
}

// @knip
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

type InviteToLobbyHandler = (friend: Friend) => void

let inviteToLobbyHandler: InviteToLobbyHandler | null = null

export function setSocialInviteToLobbyHandler(handler: InviteToLobbyHandler | null) {
  inviteToLobbyHandler = handler
}

// @knip
export const initialSocialStoreState: SocialStoreState = {
  error: null,
  messages: [],
  selectedFriendId: null,
  showOfflineGroup: useSettingsStore.getState().showOfflineGroup,
}

export const useSocialStore = create<SocialStore>()((set) => ({
  ...initialSocialStoreState,
  addMessage(message) {
    set((state) => ({
      messages: [...state.messages, message],
    }))
  },
  clearMessages() {
    set({ messages: [] })
  },
  inviteToLobby(friend) {
    inviteToLobbyHandler?.(friend)
  },
  selectFriend(friendId) {
    set({ selectedFriendId: friendId })
  },
  setError(error) {
    set({ error })
  },
  setShowOfflineGroup(value) {
    useSettingsStore.getState().setShowOfflineGroup(value)
    set({ showOfflineGroup: value })
  },
  toggleShowOfflineGroup() {
    set((state) => {
      const next = !state.showOfflineGroup
      useSettingsStore.getState().setShowOfflineGroup(next)
      return { showOfflineGroup: next }
    })
  },
}))
