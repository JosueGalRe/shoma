import type { Friend } from '../social-types'
import type { ChatSettings } from '@/core/lcu/parsers/settings'

export type { Friend } from '../social-types'

// The client's own groups beside the player's folders
export const OFFLINE_GROUP = '__offline__'
export const MOBILE_GROUP = '__mobile__'
export const PRODUCT_GROUP_PREFIX = '__product__:'

export type FriendListSettings = Pick<ChatSettings, 'chatGBG' | 'chatGroupMobile' | 'chatGroupOffline' | 'sortBy'>

export interface FriendGroup {
  friends: Friend[]
  // A folder's name, or one of the client's groups above
  id: string
  isFolder: boolean
  // A folder's friends who aren't offline, including the ones a client group took
  online: number
  total: number
}

export const DEFAULT_FRIEND_LIST_SETTINGS: FriendListSettings = {
  chatGBG: false,
  chatGroupMobile: false,
  chatGroupOffline: false,
  sortBy: 'availability',
}

// The client's availability order: online, busy, mobile, away, offline
function availabilityRank(friend: Friend): number {
  if (friend.status === 'offline') {
    return 5
  }

  if (friend.isOnMobile) {
    return 3
  }

  return { away: 4, busy: 2, online: 1 }[friend.status]
}

export function sortFriends(friends: Friend[], sortBy: FriendListSettings['sortBy']): Friend[] {
  return friends.toSorted((left, right) => {
    const byAvailability = sortBy === 'availability' ? availabilityRank(left) - availabilityRank(right) : 0

    return byAvailability || left.name.toLowerCase().localeCompare(right.name.toLowerCase())
  })
}

// "Group Games and Servers" takes offline and mobile friends out of the folders too, as the client does
function readClientGroup(friend: Friend, settings: FriendListSettings): string | null {
  if ((settings.chatGroupOffline || settings.chatGBG) && friend.status === 'offline') {
    return OFFLINE_GROUP
  }

  if ((settings.chatGroupMobile || settings.chatGBG) && friend.isOnMobile) {
    return MOBILE_GROUP
  }

  if (settings.chatGBG && friend.product && friend.product !== 'league_of_legends') {
    return `${PRODUCT_GROUP_PREFIX}${friend.product}`
  }

  return null
}

// The folders in the LCU's order, then the other games, Riot Mobile and offline, each sorted as the settings say
export function groupFriends(
  friends: Friend[],
  folders: string[],
  settings: FriendListSettings = DEFAULT_FRIEND_LIST_SETTINGS,
): FriendGroup[] {
  const folderNames = [
    ...new Set([
      ...folders,
      ...friends.map((friend) => {
        return friend.group
      }),
    ]),
  ]
  const byFolder = new Map(
    folderNames.map((folder): [string, FriendGroup] => {
      return [folder, { friends: [], id: folder, isFolder: true, online: 0, total: 0 }]
    }),
  )
  const byClientGroup = new Map<string, FriendGroup>()

  for (const friend of sortFriends(friends, settings.sortBy)) {
    const folder = byFolder.get(friend.group)
    const clientGroup = readClientGroup(friend, settings)

    if (folder) {
      folder.total += 1
      folder.online += friend.status === 'offline' ? 0 : 1
    }

    if (clientGroup) {
      const group = byClientGroup.get(clientGroup) ?? { friends: [], id: clientGroup, isFolder: false, online: 0, total: 0 }

      group.friends.push(friend)
      group.total += 1
      group.online += friend.status === 'offline' ? 0 : 1
      byClientGroup.set(clientGroup, group)
    } else {
      folder?.friends.push(friend)
    }
  }

  const clientGroups = [...byClientGroup.values()].toSorted((left, right) => {
    return clientGroupRank(left.id) - clientGroupRank(right.id) || left.id.localeCompare(right.id)
  })

  return [...byFolder.values(), ...clientGroups]
}

function clientGroupRank(id: string): number {
  if (id === OFFLINE_GROUP) {
    return 2
  }

  return id === MOBILE_GROUP ? 1 : 0
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
