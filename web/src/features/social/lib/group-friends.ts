import type { Friend } from '../social-store'

export type { Friend } from '../social-store'

export function groupFriends(friends: Friend[], groups: string[], showOfflineGroup: boolean): Array<[string, Friend[]]> {
  const fallbackGroups = [...new Set(friends.map((friend) => friend.group))]
  const orderedGroups = groups.length > 0 ? groups : fallbackGroups

  let processedFriends = friends
  let offlineFriends: Friend[] = []

  if (showOfflineGroup) {
    offlineFriends = friends.filter((friend) => friend.status === 'offline')
    processedFriends = friends.filter((friend) => friend.status !== 'offline')
  }

  const result = orderedGroups.map((group) => [
    group,
    processedFriends.filter((friend) => friend.group === group),
  ]) as Array<[string, Friend[]]>

  if (showOfflineGroup && offlineFriends.length > 0) {
    result.push(['__offline__', offlineFriends])
  }

  return result
}
