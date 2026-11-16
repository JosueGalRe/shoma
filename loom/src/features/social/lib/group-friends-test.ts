import { expect, test } from 'vitest'

import { Puuid, SummonerId } from '@/core/types/branded'

import { DEFAULT_FRIEND_LIST_SETTINGS, filterFriendsByQuery, groupFriends, MOBILE_GROUP, OFFLINE_GROUP } from './group-friends'

import type { Friend } from '../social-types'

function friend(name: string, group: string, details: Partial<Friend> & Pick<Friend, 'status'>): Friend {
  return { group, id: Puuid(`${name}-puuid`), name, summonerId: SummonerId(name.length), ...details }
}

const alice = friend('Alice', 'Alpha', { status: 'away' })
const bob = friend('bob', 'Alpha', { status: 'offline' })
const cai = friend('Cai', 'Alpha', { status: 'online' })
const dan = friend('Dan', 'Beta', { isOnMobile: true, status: 'online' })
const eve = friend('Eve', 'Beta', { product: 'valorant', status: 'busy' })

function ids(groups: ReturnType<typeof groupFriends>) {
  return groups.map((group) => {
    return [
      group.id,
      group.friends.map((each) => {
        return each.name
      }),
      `${group.online}/${group.total}`,
    ]
  })
}

test('keeps every friend in their folder, sorted by availability then name', () => {
  expect(ids(groupFriends([alice, bob, cai, dan, eve], ['Alpha', 'Beta']))).toEqual([
    ['Alpha', ['Cai', 'Alice', 'bob'], '2/3'],
    ['Beta', ['Eve', 'Dan'], '2/2'],
  ])
})

test('sorts alphabetically when the client says so', () => {
  const groups = groupFriends([alice, bob, cai], ['Alpha'], { ...DEFAULT_FRIEND_LIST_SETTINGS, sortBy: 'alphabetical' })

  expect(ids(groups)).toEqual([['Alpha', ['Alice', 'bob', 'Cai'], '2/3']])
})

test('moves offline and mobile friends to their own groups, counting them in their folder', () => {
  const settings = { ...DEFAULT_FRIEND_LIST_SETTINGS, chatGroupMobile: true, chatGroupOffline: true }

  expect(ids(groupFriends([alice, bob, cai, dan, eve], ['Alpha', 'Beta'], settings))).toEqual([
    ['Alpha', ['Cai', 'Alice'], '2/3'],
    ['Beta', ['Eve'], '2/2'],
    [MOBILE_GROUP, ['Dan'], '1/1'],
    [OFFLINE_GROUP, ['bob'], '0/1'],
  ])
})

test('groups other games, mobile and offline when grouping by game', () => {
  const groups = groupFriends([alice, bob, dan, eve], ['Alpha', 'Beta'], { ...DEFAULT_FRIEND_LIST_SETTINGS, chatGBG: true })

  expect(
    groups.map((group) => {
      return group.id
    }),
  ).toEqual(['Alpha', 'Beta', '__product__:valorant', MOBILE_GROUP, OFFLINE_GROUP])
})

test('filters friends by name query', () => {
  expect(filterFriendsByQuery([alice, bob], '  ')).toEqual([alice, bob])
  expect(filterFriendsByQuery([alice, bob], 'BOB')).toEqual([bob])
})
