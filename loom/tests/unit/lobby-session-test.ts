import { describe, expect, test } from 'vitest'

import { lobbySessionDescriptor } from '../../src/core/lcu/queries'

describe('lobby session descriptor', () => {
  test('lobbySessionDescriptor has canonical query key', () => {
    expect(lobbySessionDescriptor.queryKey).toEqual(['lcu', 'lobby', 'session'])
  })

  test('lobbySessionDescriptor.parse returns members, localSummonerId, and mode', () => {
    const payload = {
      gameConfig: { gameMode: 'CLASSIC', mapId: 11, queueId: 420 },
      localMember: { summonerId: 123 },
      members: [
        {
          allowedInviteOthers: false,
          displayName: 'TestSummoner',
          firstPositionPreference: 'UNSELECTED',
          isLeader: true,
          isLocalMember: true,
          secondPositionPreference: 'UNSELECTED',
          summonerId: 123,
        },
      ],
    }

    const result = lobbySessionDescriptor.parse(payload)

    expect(result).not.toBeNull()
    expect(result?.members).toHaveLength(1)
    expect(result?.members[0].displayName).toBe('TestSummoner')
    expect(result?.localSummonerId).toBe(123)
    expect(result?.mode).toBe('ranked-solo-duo')
  })

  test('lobbySessionDescriptor.notFoundValue has correct fallback shape', () => {
    expect(lobbySessionDescriptor.notFoundValue).toEqual({
      localSummonerId: null,
      members: [],
      mode: 'normal-draft',
      partyType: null,
      queueId: null,
    })
  })

  test('lobbySessionDescriptor.parse with empty input returns notFoundValue-like shape', () => {
    for (const emptyInput of [null, undefined]) {
      const result = lobbySessionDescriptor.parse(emptyInput)

      expect(result?.members).toEqual([])
      expect(result?.localSummonerId).toBeNull()
      expect(result?.mode).toBe('normal-draft')
    }
  })
})
