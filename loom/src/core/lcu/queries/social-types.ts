export type LcuFriendGroupsMap = Record<number | string, string>

// A friend request still waiting for an answer, sent ('out') or received ('in')
export interface FriendRequest {
  direction: string
  iconId?: number
  id: string
  name: string
}
