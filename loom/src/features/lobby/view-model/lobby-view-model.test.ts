import { describe, expect, test } from 'bun:test'

import { InvitationId, QueueId, SummonerId } from '@/core/types/branded'

import type { LobbyInvite, LobbyMember, LobbyQueueStatus, LobbySentInvite } from '../lobby-store'
import { createLobbyViewModel, type CurrentSummonerPayload, type LobbyViewModelInputs } from './lobby-view-model'

const localMember: LobbyMember = {
  allowedInviteOthers: false,
  displayName: 'Bryan',
  firstPositionPreference: 'TOP',
  iconUrl: null,
  isLeader: true,
  isLocalMember: true,
  profileIconId: null,
  secondPositionPreference: 'JUNGLE',
  summonerId: SummonerId(1001),
}

const remoteMember: LobbyMember = {
  allowedInviteOthers: true,
  displayName: 'Friend',
  firstPositionPreference: 'BOTTOM',
  iconUrl: 'fallback-icon',
  isLeader: false,
  isLocalMember: false,
  profileIconId: null,
  secondPositionPreference: 'UTILITY',
  summonerId: SummonerId(1002),
}

const unknownLocalMember: LobbyMember = {
  ...localMember,
  displayName: 'Unknown summoner',
}

const roleRequiredMember: LobbyMember = {
  ...localMember,
  firstPositionPreference: 'UNSELECTED',
  secondPositionPreference: 'UNSELECTED',
}

const queueStatus: LobbyQueueStatus = {
  isSearching: false,
  queueId: QueueId(420),
  searchState: null,
}

const invites: LobbyInvite[] = [
  {
    fromSummonerId: SummonerId(2001),
    fromSummonerName: 'Inviter',
    id: InvitationId('invite-1'),
    state: 'PENDING',
  },
]

const sentInvites: LobbySentInvite[] = [
  {
    id: InvitationId('sent-1'),
    state: 'PENDING',
    toSummonerId: SummonerId(3001),
    toSummonerName: 'Target',
  },
]

function makeInputs(overrides: Partial<LobbyViewModelInputs> = {}): LobbyViewModelInputs {
  return {
    currentSummoner: null,
    dodgePenalty: 0,
    gameflowPhase: 'Lobby',
    iconUrls: {},
    invites,
    isConnected: true,
    isLobbyGracePeriodActive: false,
    liveLobbyMode: null,
    lobbyMembers: [localMember],
    partyType: 'RANKED_SOLO',
    queueStatus,
    sentInvites,
    stickyMembers: [remoteMember],
    stickyMode: 'normal-draft',
    summonersById: {},
    ...overrides,
  }
}

function getMemberNames(result: ReturnType<typeof createLobbyViewModel>): string[] {
  return result.members.map((member) => member.displayName)
}

describe('createLobbyViewModel', () => {
  test('prefers live mode over sticky and default', () => {
    expect(createLobbyViewModel(makeInputs({ liveLobbyMode: 'aram', stickyMode: 'arena' })).mode).toBe('aram')
  })

  test('falls back to sticky mode when live mode is missing and lobby is sticky/searching', () => {
    expect(
      createLobbyViewModel(
        makeInputs({ liveLobbyMode: null, queueStatus: { ...queueStatus, isSearching: true }, stickyMode: 'arena' }),
      ).mode,
    ).toBe('arena')
  })

  test('defaults to normal-draft when no live mode and no sticky signal exists', () => {
    expect(
      createLobbyViewModel(
        makeInputs({
          liveLobbyMode: null,
          queueStatus: { ...queueStatus, isSearching: false },
          stickyMembers: [],
        }),
      ).mode,
    ).toBe('normal-draft')
  })

  test('clears members when gameflow is None', () => {
    expect(createLobbyViewModel(makeInputs({ gameflowPhase: 'None' })).members).toEqual([])
  })

  test('clears members when gameflow is ChampSelect', () => {
    expect(createLobbyViewModel(makeInputs({ gameflowPhase: 'ChampSelect' })).members).toEqual([])
  })

  test('uses live lobby members when present', () => {
    const result = createLobbyViewModel(makeInputs({ lobbyMembers: [localMember, remoteMember], stickyMembers: [] }))
    expect(getMemberNames(result)).toEqual(['Bryan', 'Friend'])
  })

  test('falls back to sticky members when lobby members are absent', () => {
    const result = createLobbyViewModel(makeInputs({ lobbyMembers: null, stickyMembers: [remoteMember] }))
    expect(getMemberNames(result)).toEqual(['Friend'])
  })

  test('uses currentSummoner display name for unknown local member', () => {
    const currentSummoner: CurrentSummonerPayload = { displayName: 'Bryan#NA1' }
    const result = createLobbyViewModel(makeInputs({ currentSummoner, lobbyMembers: [unknownLocalMember] }))

    expect(result.members[0]?.displayName).toBe('Bryan#NA1')
  })

  test('uses summoner-by-id display name when member is unknown', () => {
    const result = createLobbyViewModel(
      makeInputs({
        currentSummoner: null,
        lobbyMembers: [unknownLocalMember],
        summonersById: {
          [unknownLocalMember.summonerId]: { displayName: 'Summoner#NA1' },
        } as Record<SummonerId, CurrentSummonerPayload>,
      }),
    )

    expect(result.members[0]?.displayName).toBe('Summoner#NA1')
  })

  test('enriches profileIconId from summoner lookup when member has none', () => {
    const result = createLobbyViewModel(
      makeInputs({
        lobbyMembers: [remoteMember],
        summonersById: {
          [remoteMember.summonerId]: { displayName: 'Friend', profileIconId: 321 },
        } as Record<SummonerId, CurrentSummonerPayload>,
      }),
    )

    expect(result.members[0]?.profileIconId).toBe(321)
  })

  test('keeps explicit displayName when summoner lookup exists', () => {
    const result = createLobbyViewModel(
      makeInputs({
        lobbyMembers: [remoteMember],
        summonersById: {
          [remoteMember.summonerId]: { displayName: 'Override', profileIconId: 321 },
        } as Record<SummonerId, CurrentSummonerPayload>,
      }),
    )

    expect(result.members[0]?.displayName).toBe('Friend')
  })

  test('applies iconUrls to members with profileIconId', () => {
    const result = createLobbyViewModel(
      makeInputs({
        lobbyMembers: [{ ...remoteMember, profileIconId: 99 }],
        iconUrls: { 99: 'https://cdn/icon-99.png' },
      }),
    )

    expect(result.members[0]?.iconUrl).toBe('https://cdn/icon-99.png')
  })

  test('isOwner is true when the local member is leader', () => {
    expect(createLobbyViewModel(makeInputs()).isOwner).toBe(true)
  })

  test('rolePreferences come from the local member', () => {
    const result = createLobbyViewModel(makeInputs())

    expect(result.rolePreferences).toEqual({ first: 'TOP', second: 'JUNGLE' })
  })

  test('hasLobby is true while searching even with no members', () => {
    expect(
      createLobbyViewModel(
        makeInputs({ lobbyMembers: null, stickyMembers: [], queueStatus: { ...queueStatus, isSearching: true } }),
      ).hasLobby,
    ).toBe(true)
  })

  test('hasLobby is true during grace period even with no members', () => {
    expect(
      createLobbyViewModel(makeInputs({ lobbyMembers: null, stickyMembers: [], isLobbyGracePeriodActive: true })).hasLobby,
    ).toBe(true)
  })

  test('invites and sentInvites pass through with null-safe defaults', () => {
    const result = createLobbyViewModel(makeInputs({ invites: null, sentInvites: null }))

    expect(result.invites).toEqual([])
    expect(result.sentInvites).toEqual([])
  })

  test('partyType passes through unchanged', () => {
    expect(createLobbyViewModel(makeInputs()).partyType).toBe('RANKED_SOLO')
  })

  test('queueStatus passes through unchanged', () => {
    expect(createLobbyViewModel(makeInputs()).queueStatus).toEqual(queueStatus)
  })

  test('canInvite is true when local member can invite others even without ownership', () => {
    const result = createLobbyViewModel(
      makeInputs({ lobbyMembers: [{ ...remoteMember, isLocalMember: true, isLeader: false, allowedInviteOthers: true }] }),
    )

    expect(result.canInvite).toBe(true)
  })

  test('canJoinQueue is blocked by dodge penalty', () => {
    expect(createLobbyViewModel(makeInputs({ dodgePenalty: 15 })).canJoinQueue).toBe(false)
  })

  test('canJoinQueue is blocked when role selection is required and unselected', () => {
    const result = createLobbyViewModel(
      makeInputs({
        liveLobbyMode: 'normal-draft',
        lobbyMembers: [roleRequiredMember],
      }),
    )

    expect(result.canJoinQueue).toBe(false)
  })

  test('canJoinQueue is allowed when role selection is satisfied', () => {
    const result = createLobbyViewModel(
      makeInputs({
        liveLobbyMode: 'normal-draft',
        lobbyMembers: [localMember],
      }),
    )

    expect(result.canJoinQueue).toBe(true)
  })

  test('mode uses sticky when live mode is missing and lobby members are absent but sticky members exist', () => {
    const result = createLobbyViewModel(
      makeInputs({
        liveLobbyMode: null,
        lobbyMembers: null,
        stickyMembers: [remoteMember],
        stickyMode: 'arena',
      }),
    )

    expect(result.mode).toBe('arena')
  })
})
