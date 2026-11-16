import React, { act } from 'react'

import { createRoot } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

import { SummonerId } from '@/core/types/branded'

import { useTranslatedActivityLabels, useTranslatedStatusLabels } from '../hooks/use-social-labels'

import {
  isFriendInvitable,
  profileIconUrl,
  readCurrentUserPuuid,
  readFriendStatusDetail,
  readLobbyInvite,
  readRecentPlayers,
  translateGroupName,
} from './friend-utils'
import { MOBILE_GROUP } from './group-friends'

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

function played(puuid: string, gameName: string, date: string) {
  return { championId: 1, gameCreationDate: date, gameName, puuid, tagLine: 'LAN' }
}

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

describe('social-utils', () => {
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

    expect(
      translateGroupName(MOBILE_GROUP, (key) => {
        return key
      }),
    ).toBe('social.status.riotMobile')

    expect(
      translateGroupName('__product__:valorant', (key) => {
        return key
      }),
    ).toBe('VALORANT')
  })

  test('lists each recent player once, newest first, without friends', () => {
    const entries = [
      played('a', 'Ana', '2026-11-01T00:00:00Z'),
      played('b', 'Ben', '2026-11-03T00:00:00Z'),
      played('a', 'Ana', '2026-11-05T00:00:00Z'),
      played('c', 'Cal', '2026-11-04T00:00:00Z'),
      { puuid: 'd' },
    ]

    expect(
      readRecentPlayers(entries, ['c@la1.pvp.net']).map((player) => {
        return player.gameName
      }),
    ).toEqual(['Ana', 'Ben'])
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

  test('only online friends outside game flows are invitable', () => {
    expect(isFriendInvitable({ status: 'online' })).toBe(true)
    expect(isFriendInvitable({ activity: 'in-lobby', status: 'online' })).toBe(true)
    expect(isFriendInvitable({ status: 'busy' })).toBe(true)
    expect(isFriendInvitable({ status: 'offline' })).toBe(false)
    expect(isFriendInvitable({ isOnMobile: true, status: 'online' })).toBe(false)
    expect(isFriendInvitable({ product: 'valorant', status: 'online' })).toBe(false)
    expect(isFriendInvitable({ product: 'league_of_legends', status: 'online' })).toBe(true)
    expect(isFriendInvitable({ activity: 'in-game', status: 'online' })).toBe(false)
    expect(isFriendInvitable({ activity: 'champ-select', status: 'online' })).toBe(false)
    expect(isFriendInvitable({ activity: 'in-queue', status: 'away' })).toBe(false)
  })

  test('offers the lobby invite to a friend who can join, from a lobby the player may invite to', () => {
    const friend = { status: 'online' as const, summonerId: SummonerId(7) }
    const local = { allowedInviteOthers: false, isLeader: true, isLocalMember: true, summonerId: SummonerId(1) }

    expect(readLobbyInvite(friend, [], [])).toBeNull()
    expect(readLobbyInvite(friend, [local], [])).toBe('invitable')
    expect(readLobbyInvite(friend, [{ ...local, isLeader: false }], [])).toBeNull()
    expect(readLobbyInvite(friend, [local, { ...local, isLocalMember: false, summonerId: SummonerId(7) }], [])).toBeNull()
    expect(readLobbyInvite(friend, [local], [{ state: 'Pending', toSummonerId: SummonerId(7) }])).toBe('invited')
    expect(readLobbyInvite(friend, [local], [{ state: 'Declined', toSummonerId: SummonerId(7) }])).toBe('invitable')
    expect(readLobbyInvite({ ...friend, activity: 'in-game' }, [local], [])).toBeNull()
  })

  test('prioritizes activity, mobile and product in the status detail', () => {
    const labels = { activityLabel: 'In game', riotMobileLabel: 'Riot Mobile', statusLabel: 'Online' }
    const idleLabels = { ...labels, activityLabel: undefined }

    expect(readFriendStatusDetail({ gameMode: 'ARAM', isOnMobile: true, product: 'valorant' }, labels)).toBe('In game · ARAM')

    expect(readFriendStatusDetail({ isOnMobile: true }, idleLabels)).toBe('Riot Mobile')

    expect(readFriendStatusDetail({ product: 'valorant' }, idleLabels)).toBe('VALORANT')

    expect(readFriendStatusDetail({ product: 'league_of_legends' }, idleLabels)).toBe('Online')

    expect(readFriendStatusDetail({}, idleLabels)).toBe('Online')
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
