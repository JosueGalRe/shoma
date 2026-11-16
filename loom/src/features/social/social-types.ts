import type { ReactNode } from 'react'

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
}

export interface FriendRowProps {
  iconUrl: string | undefined
  name: string
  online: boolean
  onSelect: () => void
  status: string
}

export interface SheetProps {
  onOpenChange: (open: boolean) => void
  open: boolean
}

export interface AddFriendSheetProps extends SheetProps {
  friends: Friend[]
}

export interface ChatScreenProps extends SheetProps {
  friend: Friend | null
}

export interface RecentPlayer {
  championId: number
  gameName: string
  puuid: string
  tagLine: string
}
