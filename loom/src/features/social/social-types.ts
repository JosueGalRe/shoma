import type { ReactNode } from 'react'

import type { LcuChatParticipant } from '@/core/lcu/parsers'
import type { Puuid as PuuidType, SummonerId as SummonerIdType } from '@/core/types/branded'
import type { StyleXStyles } from '@stylexjs/stylex'

export type FriendStatus = 'online' | 'away' | 'busy' | 'offline'

export type FriendActivity = 'in-game' | 'champ-select' | 'in-queue' | 'in-lobby'

export interface Friend {
  activity?: FriendActivity
  gameMode?: string
  group: string
  iconId?: number
  id: PuuidType
  isOnMobile?: boolean
  mapId?: number
  name: string
  product?: string
  queueId?: number
  status: FriendStatus
  summonerId: SummonerIdType
}

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

export interface MapChatMessagesContext {
  activeConversation: { participantNames: string[]; participantPuuids: string[] } | undefined
  currentUserPuuid: string | undefined
  friends: Friend[]
  participants?: LcuChatParticipant[]
}

export interface SocialLayerProps {
  // Right of the title, e.g. Add Friend
  actions?: ReactNode
  backLabel: string
  children: ReactNode
  // Between the back arrow and the title, e.g. the friend's picture in a chat
  leading?: ReactNode
  onOpenChange: (open: boolean) => void
  open: boolean
  // Under the title, e.g. what the friend is doing; '' keeps its line until it has something
  subtitle?: string
  title: string
  // Social's title is larger than a chat's
  titleStyle: StyleXStyles
}

export interface SocialEmptyProps {
  children: string
  // The client's poro: puzzled for an empty list or chat, sad for no one played with recently
  poro: 'question' | 'sad'
  style?: StyleXStyles
}

export interface FriendGroupProps {
  // The group's rows, each an <li>
  children: ReactNode
  title: string
  // Its friends' unread messages, counted on the name while it's folded
  unread?: number
}

export interface FriendRowProps {
  iconUrl: string | undefined
  name: string
  online: boolean
  onSelect: () => void
  status: string
  unread: number
}

export interface UnreadBadgeProps {
  count: number
}

export interface SheetProps {
  onOpenChange: (open: boolean) => void
  open: boolean
}

export interface AddFriendSheetProps extends SheetProps {
  friends: Friend[]
}

export interface ClashTeam {
  conversationId: string
  logoUrl: string | undefined
  // Null while the team is still forming, which the client calls a pending team
  name: string | null
  shortName: string
}

// The chat Social has open, by the friend's id or the team's conversation id
export interface OpenChat {
  id: string | null
  kind: ChatTarget['kind']
  open: boolean
}

// What a chat is with: a friend, 1:1, or a Clash team, a group
export type ChatTarget = { friend: Friend; kind: 'friend' } | { kind: 'clash'; team: ClashTeam }

// The chat's title bar: the friend's or the team's picture, name and status line
export interface ChatHeader {
  iconUrl: string | undefined
  online: boolean
  subtitle: string
  title: string
}

export interface ChatScreenProps extends SheetProps {
  target: ChatTarget | null
}

export interface ChatMessagesProps {
  // A group puts each sender's picture by the message, the local player's own on their side
  avatars: { ownIconUrl: string | undefined; senderIconUrl: (iconId: number | undefined) => string | undefined } | null
  isLoading: boolean
  messages: SocialChatMessage[]
}

export interface ChatInviteButtonProps {
  friend: Friend
}

export interface ClashTeamRowProps {
  onSelect: () => void
  team: ClashTeam
  unread: number
}

export interface RecentPlayer {
  championId: number
  gameName: string
  puuid: string
  tagLine: string
}
