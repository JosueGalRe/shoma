// A folder of the friend list; the client lists them by priority, the highest first
export interface LcuFriendGroup {
  id: number
  name: string
  priority: number
}

// A friend request still waiting for an answer, sent ('out') or received ('in')
export interface FriendRequest {
  direction: string
  iconId?: number
  id: string
  name: string
}
