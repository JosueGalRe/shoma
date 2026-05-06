import { create } from 'zustand'

import { Puuid, SummonerId, type Puuid as PuuidType, type SummonerId as SummonerIdType } from '@/core/types/branded'

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

export const mockFriends: Friend[] = [
  {
    group: 'GENERAL',
    iconId: 29,
    id: Puuid('friend-ari'),
    name: 'Ari Bot',
    status: 'online',
    summonerId: SummonerId(1001),
  },
  {
    group: 'GENERAL',
    iconId: 16,
    id: Puuid('friend-braum'),
    name: 'Braum Main',
    status: 'away',
    summonerId: SummonerId(1002),
  },
  {
    group: 'GENERAL',
    iconId: 7,
    id: Puuid('friend-riven'),
    name: 'Broken Blade',
    status: 'offline',
    summonerId: SummonerId(1003),
  },
  {
    group: 'UWU',
    iconId: 5034,
    id: Puuid('friend-lulu'),
    name: 'Pix Courier',
    status: 'online',
    summonerId: SummonerId(2001),
  },
  {
    group: 'UWU',
    iconId: 5221,
    id: Puuid('friend-yuumi'),
    name: 'Book Rider',
    status: 'away',
    summonerId: SummonerId(2002),
  },
  {
    group: 'CLASH',
    iconId: 5390,
    id: Puuid('friend-sejuani'),
    name: 'Freljord Shotcaller',
    status: 'offline',
    summonerId: SummonerId(3001),
  },
]

export const mockSocialGroups = ['GENERAL', 'UWU', 'CLASH']

export const initialSocialStoreState: SocialStoreState = {
  error: null,
  messages: [
    {
      friendId: Puuid('friend-ari'),
      id: 'message-ari-1',
      isOutgoing: false,
      text: 'Queue after this game?',
      timestamp: Date.now() - 1000 * 60 * 12,
    },
    {
      friendId: Puuid('friend-ari'),
      id: 'message-ari-2',
      isOutgoing: true,
      text: 'Yep, invite me when ready.',
      timestamp: Date.now() - 1000 * 60 * 10,
    },
    {
      friendId: Puuid('friend-lulu'),
      id: 'message-lulu-1',
      isOutgoing: false,
      text: 'Support diff incoming ✨',
      timestamp: Date.now() - 1000 * 60 * 6,
    },
  ],
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
