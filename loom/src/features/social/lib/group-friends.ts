import type { Friend } from '../social-types'

export type { Friend } from '../social-types'

export function groupFriends(friends: Friend[], groups: string[], showOfflineGroup: boolean): [string, Friend[]][] {
  const fallbackGroups = [
    ...new Set(
      friends.map((friend) => {
        return friend.group
      }),
    ),
  ]
  const orderedGroups = groups.length > 0 ? groups : fallbackGroups
  const visibleGroups = showOfflineGroup
    ? orderedGroups.filter((group) => {
        return group.toUpperCase() !== 'OFFLINE'
      })
    : orderedGroups

  let processedFriends = friends
  let offlineFriends: Friend[] = []

  if (showOfflineGroup) {
    offlineFriends = friends.filter((friend) => {
      return friend.status === 'offline'
    })

    processedFriends = friends.filter((friend) => {
      return friend.status !== 'offline'
    })
  }

  const result: [string, Friend[]][] = visibleGroups.map((group) => {
    return [
      group,
      processedFriends.filter((friend) => {
        return friend.group === group
      }),
    ]
  })

  if (showOfflineGroup && offlineFriends.length > 0) {
    result.push(['__offline__', offlineFriends])
  }

  return result
}

export function filterFriendsByQuery(friends: Friend[], query: string): Friend[] {
  const normalizedQuery = query.trim().toLowerCase()

  if (normalizedQuery.length === 0) {
    return friends
  }

  return friends.filter((friend) => {
    return friend.name.toLowerCase().includes(normalizedQuery)
  })
}
