import React from 'react'
import { createRoot } from 'react-dom/client'
import { act } from 'react-dom/test-utils'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

import { Puuid, SummonerId } from '@/core/types/branded'

import { groupFriends } from '../lib/group-friends'
import type { Friend } from '../social-types'
import { profileIconUrl, readCurrentUserPuuid, translateGroupName, useTranslatedStatusLabels } from './social-utils'

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
      offline: 'social.status.offline',
      online: 'social.status.online',
    })
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
