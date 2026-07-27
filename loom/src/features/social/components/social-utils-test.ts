import React, { act } from 'react'

import { createRoot } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

import { Puuid, SummonerId } from '@/core/types/branded'

import { filterFriendsByQuery, groupFriends } from '../lib/group-friends'

import {
  findFriendForConversation,
  isFriendInvitable,
  profileIconUrl,
  readConversationTitle,
  readCurrentUserPuuid,
  translateGroupName,
  useTranslatedActivityLabels,
  useTranslatedInviteStateLabels,
  useTranslatedStatusLabels,
} from './social-utils'

import type { Friend } from '../social-types'

vi.mock('react-i18next', () => {
  return {
    useTranslation: () => {
      return {
        t: (key: string) => {
          return key
        },
      }
    },
  }
})

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

let container: HTMLDivElement | null = null
let root: ReturnType<typeof createRoot> | null = null

function renderHookResult<T>(hook: () => T): T {
  let result: T | undefined

  function TestComponent() {
    result = hook()

    return null
  }

  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)

  act(() => {
    root?.render(React.createElement(TestComponent))
  })

  if (result === undefined) {
    throw new Error('Hook did not render')
  }

  return result
}

beforeEach(() => {
  vi.clearAllMocks()
})

afterEach(() => {
  act(() => {
    root?.unmount()
  })

  root = null
  container?.remove()
  container = null
})

test('filters friends by name query', () => {
  expect(filterFriendsByQuery([alice, bob], '')).toEqual([alice, bob])

  expect(filterFriendsByQuery([alice, bob], '  ')).toEqual([alice, bob])

  expect(filterFriendsByQuery([alice, bob], 'ali')).toEqual([alice])

  expect(filterFriendsByQuery([alice, bob], 'BOB')).toEqual([bob])

  expect(filterFriendsByQuery([alice, bob], 'carol')).toEqual([])
})

describe('social-utils', () => {
  test('groups offline friends into the virtual offline bucket', () => {
    expect(groupFriends([alice, bob], ['Alpha'], true)).toEqual([
      ['Alpha', [alice]],
      ['__offline__', [bob]],
    ])
  })

  test('normalizes default and offline group labels', () => {
    expect(
      translateGroupName('__offline__', (key) => {
        return key
      }),
    ).toBe('social.group.offline')

    expect(
      translateGroupName('*general', (key) => {
        return key
      }),
    ).toBe('social.group.default')

    expect(
      translateGroupName('  Custom Team  ', (key) => {
        return key
      }),
    ).toBe('Custom Team')
  })

  test('returns translated status labels', () => {
    expect(
      renderHookResult(() => {
        return useTranslatedStatusLabels()
      }),
    ).toEqual({
      away: 'social.status.away',
      busy: 'social.status.busy',
      offline: 'social.status.offline',
      online: 'social.status.online',
    })
  })

  test('returns translated activity labels', () => {
    expect(
      renderHookResult(() => {
        return useTranslatedActivityLabels()
      }),
    ).toEqual({
      'champ-select': 'social.activity.champSelect',
      'in-game': 'social.activity.inGame',
      'in-lobby': 'social.activity.inLobby',
      'in-queue': 'social.activity.inQueue',
    })
  })

  test('returns translated invite state labels', () => {
    expect(
      renderHookResult(() => {
        return useTranslatedInviteStateLabels()
      }),
    ).toEqual({
      Accepted: 'social.inviteState.accepted',
      Declined: 'social.inviteState.declined',
      Kicked: 'social.inviteState.kicked',
      Pending: 'social.inviteState.pending',
    })
  })

  test('only online friends outside game flows are invitable', () => {
    expect(isFriendInvitable({ status: 'online' })).toBe(true)
    expect(isFriendInvitable({ activity: 'in-lobby', status: 'online' })).toBe(true)
    expect(isFriendInvitable({ status: 'busy' })).toBe(true)
    expect(isFriendInvitable({ status: 'offline' })).toBe(false)
    expect(isFriendInvitable({ activity: 'in-game', status: 'online' })).toBe(false)
    expect(isFriendInvitable({ activity: 'champ-select', status: 'online' })).toBe(false)
    expect(isFriendInvitable({ activity: 'in-queue', status: 'away' })).toBe(false)
  })

  test('reads conversation titles from name or participants', () => {
    expect(readConversationTitle({ name: 'Duo Queue', participantNames: ['A', 'B'] })).toBe('Duo Queue')

    expect(readConversationTitle({ name: '  ', participantNames: ['A', 'B'] })).toBe('A, B')

    expect(readConversationTitle({ participantNames: [] })).toBeUndefined()
  })

  test('matches friends to one-to-one conversations only', () => {
    const oneToOne = { participantPuuids: ['puuid-alice@la1', 'puuid-self@la1'] }
    const groupChat = { participantPuuids: ['puuid-alice@la1', 'puuid-bob@la1', 'puuid-self@la1'] }

    expect(findFriendForConversation(oneToOne, [alice, bob])).toBe(alice)

    expect(findFriendForConversation(groupChat, [alice, bob])).toBeUndefined()

    expect(findFriendForConversation({ participantPuuids: ['nobody'] }, [alice])).toBeUndefined()
  })

  test('builds profile urls and reads the current user puuid defensively', () => {
    expect(profileIconUrl('15.14.1', 123)).toBe('https://ddragon.leagueoflegends.com/cdn/15.14.1/img/profileicon/123.png')
    expect(profileIconUrl(undefined, 123)).toBeUndefined()
    expect(profileIconUrl('15.14.1', -1)).toBeUndefined()
    expect(readCurrentUserPuuid({ puuid: 'puuid-1' })).toBe('puuid-1')
    expect(readCurrentUserPuuid({ puuid: 123 })).toBeUndefined()
    expect(readCurrentUserPuuid(null)).toBeUndefined()
  })
})
