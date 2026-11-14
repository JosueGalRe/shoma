import { describe, expect, it } from 'vitest'

import { SummonerId } from '@/core/types/branded'

import { getMemberRegalia, getPartySlots } from './lobby-party-utils'

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
    puuid: null,
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

describe('getMemberRegalia', () => {
  const bannerSkins = {
    '1': '/lol-game-data/assets/ASSETS/Regalia/BannerSkins/default.png',
    '10': '/lol-game-data/assets/ASSETS/Regalia/BannerSkins/HallofLegends2024SignatureBanner.png',
  }

  it('resolves the banner and the tokens', () => {
    const regalia = getMemberRegalia(
      {
        bannerId: '10',
        tokenIconPaths: ['/lol-game-data/assets/ASSETS/Challenges/Config/204102/Tokens/GRANDMASTER.png'],
      },
      bannerSkins,
    )

    expect(regalia.bannerUrl).toMatch(/\/assets\/regalia\/bannerskins\/halloflegends2024signaturebanner\.png$/u)
    expect(regalia.tokenUrls).toEqual([expect.stringMatching(/\/challenges\/config\/204102\/tokens\/grandmaster\.png$/u)])
  })

  it('hangs the default banner for a player who never picked one, none while loading', () => {
    expect(getMemberRegalia({ bannerId: null, tokenIconPaths: [] }, bannerSkins).bannerUrl).toMatch(
      /\/bannerskins\/default\.png$/u,
    )

    expect(getMemberRegalia(null, bannerSkins).bannerUrl).toMatch(/\/bannerskins\/default\.png$/u)

    expect(getMemberRegalia(undefined, bannerSkins)).toEqual({ bannerUrl: undefined, tokenUrls: [] })
  })

  it('leaves out a banner the catalog lacks', () => {
    expect(getMemberRegalia({ bannerId: '99', tokenIconPaths: [] }, bannerSkins).bannerUrl).toBeUndefined()
  })
})
