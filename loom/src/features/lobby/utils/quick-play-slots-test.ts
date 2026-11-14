import { describe, expect, test } from 'vitest'

import { RuneId, SummonerId } from '@/core/types/branded'

import { findSlotPerkPage, getQuickPlayAction, setSlotChampion, setSlotPosition, toSlotPerks } from './quick-play-slots'

import type { QuickPlaySlot } from '@/core/lcu/parsers/lobby'
import type { LobbyMember } from '@/features/lobby/lobby-store'

const SPELLS = [3, 4, 6, 7, 11, 12, 14, 21]

function slot(patch: Partial<QuickPlaySlot>): QuickPlaySlot {
  return { championId: 0, perks: '', positionPreference: 'UNSELECTED', skinId: 0, spell1: 4, spell2: 7, ...patch }
}

function member(patch: Partial<LobbyMember>): LobbyMember {
  return {
    allowedInviteOthers: false,
    displayName: 'Player',
    fifthPositionPreference: 'UNSELECTED',
    firstPositionPreference: 'UNSELECTED',
    fourthPositionPreference: 'UNSELECTED',
    iconUrl: null,
    isLeader: false,
    isLocalMember: false,
    isQuickPlayReady: false,
    profileIconId: null,
    puuid: null,
    quickPlaySlots: [],
    secondPositionPreference: 'UNSELECTED',
    summonerId: SummonerId(1),
    thirdPositionPreference: 'UNSELECTED',
    ...patch,
  }
}

describe('Swift Play slots', () => {
  test('a new champion starts on its base skin with its runes to fill', () => {
    const { slots, swapped } = setSlotChampion(
      [slot({ championId: 1, perks: 'x', skinId: 1004 }), slot({ championId: 2 })],
      0,
      222,
    )

    expect(swapped).toBe(false)
    expect(slots[0]).toMatchObject({ championId: 222, perks: '', skinId: 222_000 })
    expect(slots[1]?.championId).toBe(2)
  })

  test("the other option's champion swaps the options", () => {
    const { slots, swapped } = setSlotChampion([slot({ championId: 1 }), slot({ championId: 2 })], 0, 2)

    expect(swapped).toBe(true)

    expect(
      slots.map(({ championId }) => {
        return championId
      }),
    ).toEqual([2, 1])
  })

  test('fills a missing second option when the lobby has none', () => {
    expect(setSlotChampion([], 1, 222).slots).toEqual([
      slot({ spell1: 0, spell2: 0 }),
      slot({ championId: 222, skinId: 222_000, spell1: 0, spell2: 0 }),
    ])
  })

  test('a jungler takes Smite, beside Flash', () => {
    const slots = setSlotPosition(
      [slot({ positionPreference: 'TOP', spell2: 12 }), slot({ positionPreference: 'BOTTOM' })],
      { option: 0, position: 'JUNGLE' },
      SPELLS,
    )

    expect(slots[0]).toMatchObject({ positionPreference: 'JUNGLE', spell1: 4, spell2: 11 })
  })

  test("the other option's position swaps the positions, and the old jungler trades Smite", () => {
    const slots = setSlotPosition(
      [slot({ positionPreference: 'TOP', spell2: 12 }), slot({ positionPreference: 'JUNGLE', spell2: 11 })],
      { option: 0, position: 'JUNGLE' },
      SPELLS,
    )

    expect(slots[0]).toMatchObject({ positionPreference: 'JUNGLE', spell2: 11 })
    expect(slots[1]).toMatchObject({ positionPreference: 'TOP', spell2: 12 })
  })

  test('leaving the jungle for the middle trades Smite for Ignite', () => {
    const slots = setSlotPosition(
      [slot({ positionPreference: 'JUNGLE', spell2: 11 }), slot({})],
      { option: 0, position: 'MIDDLE' },
      SPELLS,
    )

    expect(slots[0]).toMatchObject({ positionPreference: 'MIDDLE', spell1: 4, spell2: 14 })
  })

  test("matches an option's runes to a page", () => {
    const page = {
      id: 7,
      isActive: false,
      isEditable: true,
      name: 'Jinx',
      order: 0,
      primaryStyleId: RuneId(8000),
      selectedPerkIds: [RuneId(8008), RuneId(8009)],
      subStyleId: RuneId(8200),
    }

    expect(toSlotPerks(page)).toBe('{"perkIds":[8008,8009],"perkStyle":8000,"perkSubStyle":8200}')
    expect(findSlotPerkPage('{"perkStyle":8000,"perkSubStyle":8200,"perkIds":[8008,8009]}', [page])).toBe(page)
    expect(findSlotPerkPage('{"perkIds":[8008],"perkStyle":8000,"perkSubStyle":8200}', [page])).toBeUndefined()
  })
})

describe('getQuickPlayAction', () => {
  const champion = [slot({ championId: 222 })]

  test('alone: finds the match once the first option has a champion', () => {
    expect(getQuickPlayAction([member({ isLeader: true, isLocalMember: true })])).toMatchObject({
      disabled: true,
      kind: 'find-match',
    })

    expect(getQuickPlayAction([member({ isLeader: true, isLocalMember: true, quickPlaySlots: champion })])).toMatchObject({
      disabled: false,
      kind: 'find-match',
    })
  })

  test('a member readies once and counts who is ready', () => {
    const leader = member({ isLeader: true, isQuickPlayReady: true })

    expect(getQuickPlayAction([leader, member({ isLocalMember: true, quickPlaySlots: champion })])).toEqual({
      disabled: false,
      kind: 'ready',
      playersReady: 1,
    })

    expect(
      getQuickPlayAction([leader, member({ isLocalMember: true, isQuickPlayReady: true, quickPlaySlots: champion })]),
    ).toEqual({
      disabled: true,
      kind: 'ready',
      playersReady: 2,
    })
  })

  test('the leader waits for everyone else', () => {
    const leader = member({ isLeader: true, isLocalMember: true, quickPlaySlots: champion })

    expect(getQuickPlayAction([leader, member({})]).disabled).toBe(true)
    expect(getQuickPlayAction([leader, member({ isQuickPlayReady: true })]).disabled).toBe(false)
  })
})
