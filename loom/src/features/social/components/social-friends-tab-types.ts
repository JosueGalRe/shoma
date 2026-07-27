import type { Friend, FriendsListGroup } from '../social-types'
import type { Puuid, SummonerId } from '@/core/types/branded'

export interface SocialFriendsTabProps {
  visibleFriends: Friend[]
  unreadCounts: ReadonlyMap<Puuid, number>
  sentInviteStates: ReadonlyMap<SummonerId, string>
  groupedFriends: FriendsListGroup[]
  collapsedGroups: Set<string>
  handleToggleGroup: (group: string) => void
  selectedFriendId: Puuid | null
  handleSelectFriend: (friendId: Puuid) => void
  handleInvite: (friend: Friend) => void
  isDisconnected: boolean
  isInviting: boolean
  ddragonVersion: string | undefined
  searchQuery: string
  setSearchQuery: (query: string) => void
}
