import { expect, test } from 'vitest'

import { Puuid, SummonerId } from '@/core/types/branded'

import { groupFriends } from '../lib/group-friends'
import type { Friend } from '../social-types'

function createFriend(overrides: Partial<Friend> & Pick<Friend, 'group' | 'id' | 'name' | 'status' | 'summonerId'>): Friend {
  return {
    iconId: 1,
    ...overrides,
  }
}

const alice = createFriend({
  group: 'Alpha',
  id: Puuid('puuid-alice'),
  name: 'Alice',
  status: 'online',
  summonerId: SummonerId(101),
})

const bob = createFriend({
  group: 'Alpha',
  id: Puuid('puuid-bob'),
  name: 'Bob',
  status: 'offline',
  summonerId: SummonerId(102),
})

const caitlyn = createFriend({
  group: 'Beta',
  id: Puuid('puuid-caitlyn'),
  name: 'Caitlyn',
  status: 'away',
  summonerId: SummonerId(103),
})

const diana = createFriend({
  group: 'Beta',
  id: Puuid('puuid-diana'),
  name: 'Diana',
  status: 'offline',
  summonerId: SummonerId(104),
})

const eric = createFriend({
  group: 'Gamma',
  id: Puuid('puuid-eric'),
  name: 'Eric',
  status: 'online',
  summonerId: SummonerId(105),
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
