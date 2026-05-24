import { expect, test } from 'vitest'

import type { Puuid, SummonerId } from '@/core/types/branded'

import { groupFriends, type Friend } from '../lib/group-friends'

function createFriend(overrides: Partial<Friend> & Pick<Friend, 'group' | 'id' | 'name' | 'status' | 'summonerId'>): Friend {
  return {
    iconId: 1,
    ...overrides,
  }
}

const alice = createFriend({
  group: 'Alpha',
  id: 'puuid-alice' as Puuid,
  name: 'Alice',
  status: 'online',
  summonerId: 101 as SummonerId,
})

const bob = createFriend({
  group: 'Alpha',
  id: 'puuid-bob' as Puuid,
  name: 'Bob',
  status: 'offline',
  summonerId: 102 as SummonerId,
})

const caitlyn = createFriend({
  group: 'Beta',
  id: 'puuid-caitlyn' as Puuid,
  name: 'Caitlyn',
  status: 'away',
  summonerId: 103 as SummonerId,
})

const diana = createFriend({
  group: 'Beta',
  id: 'puuid-diana' as Puuid,
  name: 'Diana',
  status: 'offline',
  summonerId: 104 as SummonerId,
})

const eric = createFriend({
  group: 'Gamma',
  id: 'puuid-eric' as Puuid,
  name: 'Eric',
  status: 'online',
  summonerId: 105 as SummonerId,
})

test('groupFriends extracts offline friends into a final virtual group', () => {
  const result = groupFriends([alice, bob, caitlyn, diana, eric], ['Alpha', 'Beta', 'Gamma'], true)

  expect(result).toEqual([
    ['Alpha', [alice]],
    ['Beta', [caitlyn]],
    ['Gamma', [eric]],
    ['__offline__', [bob, diana]],
  ])
})

test('groupFriends keeps offline friends in place when the virtual group is disabled', () => {
  const result = groupFriends([alice, bob, caitlyn, diana, eric], ['Alpha', 'Beta', 'Gamma'], false)

  expect(result).toEqual([
    ['Alpha', [alice, bob]],
    ['Beta', [caitlyn, diana]],
    ['Gamma', [eric]],
  ])
})

test('groupFriends does not add a virtual group when no friends are offline', () => {
  const result = groupFriends([alice, caitlyn, eric], ['Alpha', 'Beta', 'Gamma'], true)

  expect(result).toEqual([
    ['Alpha', [alice]],
    ['Beta', [caitlyn]],
    ['Gamma', [eric]],
  ])
})

test('groupFriends preserves empty original groups after extracting offline friends', () => {
  const result = groupFriends([bob, diana, eric], ['Alpha', 'Beta', 'Gamma'], true)

  expect(result).toEqual([
    ['Alpha', []],
    ['Beta', []],
    ['Gamma', [eric]],
    ['__offline__', [bob, diana]],
  ])
})
