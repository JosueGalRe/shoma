import type { Friend } from '../social-types'

export type { Friend } from '../social-types'

export function groupFriends(friends: Friend[], groups: string[], showOfflineGroup: boolean): Array<[string, Friend[]]> {
  const fallbackGroups = [...new Set(friends.map((friend) => friend.group))]
  const orderedGroups = groups.length > 0 ? groups : fallbackGroups

  let processedFriends = friends
  let offlineFriends: Friend[] = []

  if (showOfflineGroup) {
    offlineFriends = friends.filter((friend) => friend.status === 'offline')
    processedFriends = friends.filter((friend) => friend.status !== 'offline')
  }

  const result: Array<[string, Friend[]]> = orderedGroups.map((group) => [group, processedFriends.filter((friend) => friend.group === group)])

  if (showOfflineGroup && offlineFriends.length > 0) {
    result.push(['__offline__', offlineFriends])
  }

  return result
}
