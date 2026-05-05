import { create } from 'zustand'

export const friendStatuses = ['online', 'away', 'offline'] as const
export type FriendStatus = (typeof friendStatuses)[number]

export type Friend = {
  group: string
  iconId?: number
  id: string
  name: string
  status: FriendStatus
  summonerId: string
}

export type ChatMessage = {
  friendId: string
  id: string
  isOutgoing: boolean
  text: string
  timestamp: number
}

export type SocialStoreState = {
  error: string | null
  messages: ChatMessage[]
  selectedFriendId: string | null
}

export type SocialStoreActions = {
  addMessage: (message: ChatMessage) => void
  inviteToLobby: (friend: Friend) => void
  selectFriend: (friendId: string | null) => void
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
    id: 'friend-ari',
    name: 'Ari Bot',
    status: 'online',
    summonerId: '1001',
  },
  {
    group: 'GENERAL',
    iconId: 16,
    id: 'friend-braum',
    name: 'Braum Main',
    status: 'away',
    summonerId: '1002',
  },
  {
    group: 'GENERAL',
    iconId: 7,
    id: 'friend-riven',
    name: 'Broken Blade',
    status: 'offline',
    summonerId: '1003',
  },
  {
    group: 'UWU',
    iconId: 5034,
    id: 'friend-lulu',
    name: 'Pix Courier',
    status: 'online',
    summonerId: '2001',
  },
  {
    group: 'UWU',
    iconId: 5221,
    id: 'friend-yuumi',
    name: 'Book Rider',
    status: 'away',
    summonerId: '2002',
  },
  {
    group: 'CLASH',
    iconId: 5390,
    id: 'friend-sejuani',
    name: 'Freljord Shotcaller',
    status: 'offline',
    summonerId: '3001',
  },
]

export const mockSocialGroups = ['GENERAL', 'UWU', 'CLASH']

export const initialSocialStoreState: SocialStoreState = {
  error: null,
  messages: [
    {
      friendId: 'friend-ari',
      id: 'message-ari-1',
      isOutgoing: false,
      text: 'Queue after this game?',
      timestamp: Date.now() - 1000 * 60 * 12,
    },
    {
      friendId: 'friend-ari',
      id: 'message-ari-2',
      isOutgoing: true,
      text: 'Yep, invite me when ready.',
      timestamp: Date.now() - 1000 * 60 * 10,
    },
    {
      friendId: 'friend-lulu',
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
