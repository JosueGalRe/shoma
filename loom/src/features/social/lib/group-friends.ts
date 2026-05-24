import type { Friend } from '../social-types'

export type { Friend } from '../social-types'

export function groupFriends(friends: Friend[], groups: string[], showOfflineGroup: boolean): Array<[string, Friend[]]> {
  const fallbackGroups = [...new Set(friends.map((friend) => { return friend.group; }))]
  const orderedGroups = groups.length > 0 ? groups : fallbackGroups

  let processedFriends = friends
  let offlineFriends: Friend[] = []

  if (showOfflineGroup) {
    offlineFriends = friends.filter((friend) => { return friend.status === 'offline'; })
    processedFriends = friends.filter((friend) => { return friend.status !== 'offline'; })
  }

  const result: Array<[string, Friend[]]> = orderedGroups.map((group) => {return [group, processedFriends.filter((friend) => { return friend.group === group; })]})

  if (showOfflineGroup && offlineFriends.length > 0) {
    result.push(['__offline__', offlineFriends])
  }

  return result
}
