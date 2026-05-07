import { create } from 'zustand'

import { type Puuid as PuuidType, type SummonerId as SummonerIdType } from '@/core/types/branded'

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

export type ChatMessage = {
  friendId: PuuidType
  id: string
  isOutgoing: boolean
  text: string
  timestamp: number
}

export type SocialStoreState = {
  error: string | null
  messages: ChatMessage[]
  selectedFriendId: PuuidType | null
}

export type SocialStoreActions = {
  addMessage: (message: ChatMessage) => void
  inviteToLobby: (friend: Friend) => void
  selectFriend: (friendId: PuuidType | null) => void
  setError: (error: string | null) => void
}

export type SocialStore = SocialStoreState & SocialStoreActions

type InviteToLobbyHandler = (friend: Friend) => void

let inviteToLobbyHandler: InviteToLobbyHandler | null = null

export function setSocialInviteToLobbyHandler(handler: InviteToLobbyHandler | null) {
  inviteToLobbyHandler = handler
}

export const initialSocialStoreState: SocialStoreState = {
  error: null,
  messages: [],
  selectedFriendId: null,
}

export const useSocialStore = create<SocialStore>()((set) => ({
  ...initialSocialStoreState,
  addMessage(message) {
    set((state) => ({
      messages: [...state.messages, message],
    }))
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
}))
