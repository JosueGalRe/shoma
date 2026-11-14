import { describe, expect, it } from 'vitest'

import { SummonerId } from '@/core/types/branded'

import { getPartySlots } from './lobby-party-utils'

import type { LobbyMember } from '@/features/lobby/lobby-store'

function member(id: number): LobbyMember {
  return {
    allowedInviteOthers: false,
    displayName: `Player ${id}`,
    firstPositionPreference: 'UNSELECTED',
    iconUrl: null,
    isLeader: false,
    isLocalMember: id === 1,
    profileIconId: null,
    secondPositionPreference: 'UNSELECTED',
    summonerId: SummonerId(id),
  }
}

function ids(slots: (LobbyMember | null)[]) {
  return slots.map((slot) => {
    return slot ? Number(slot.summonerId) : null
  })
}

describe('getPartySlots', () => {
  it('puts the first member in the middle and fills outward, left first', () => {
    expect(ids(getPartySlots([member(1)], 5))).toEqual([null, null, 1, null, null])
    expect(ids(getPartySlots([member(1), member(2), member(3)], 5))).toEqual([null, 2, 1, 3, null])
    expect(ids(getPartySlots([1, 2, 3, 4, 5].map(member), 5))).toEqual([4, 2, 1, 3, 5])
  })

  it('leaves a duo its second place on the right', () => {
    expect(ids(getPartySlots([member(1)], 2))).toEqual([1, null])
  })

  it('keeps members past the party size instead of dropping them', () => {
    expect(ids(getPartySlots([member(1), member(2)], 1))).toEqual([1, 2])
  })
})
