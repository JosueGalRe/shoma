import { LcuPaths } from '@shoma/protocol-contract'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { READY_CHECK_SECONDS } from '@/features/ready-check/ready-check-utils'

import { SimWorld } from './sim-world'

import type { SimCaptures, SimEvent } from './sim-types'

const LOCAL_ID = 42
const FRIEND_ID = 77

const captures: SimCaptures = {
  [LcuPaths.gameQueues.queues]: {
    content: [
      {
        allowablePremadeSizes: [1, 2, 3, 4, 5],
        gameMode: 'SWIFTPLAY',
        id: 480,
        mapId: 11,
        numPlayersPerTeam: 5,
        showPositionSelector: false,
        showQuickPlaySlotSelection: true,
      },
      { allowablePremadeSizes: [1, 2], gameMode: 'CLASSIC', id: 420, mapId: 11, showPositionSelector: true },
    ],
    status: 200,
  },
  [LcuPaths.social.friends]: {
    content: [{ gameName: 'Friend', gameTag: 'TAG', icon: 10, puuid: 'friend-puuid', summonerId: FRIEND_ID }],
    status: 200,
  },
  [LcuPaths.summoner.currentSummoner]: {
    content: {
      gameName: 'Local',
      profileIconId: 5,
      puuid: 'local-puuid',
      summonerId: LOCAL_ID,
      summonerLevel: 30,
      tagLine: 'NA1',
    },
    status: 200,
  },
  '/lol-perks/v1/recommended-pages/champion/1/position/MIDDLE/map/11': { content: [{ name: 'Annie' }], status: 200 },
}

function readContent(world: SimWorld, path: string): Record<string, unknown> {
  const { content } = world.request('GET', path)

  return typeof content === 'object' && content !== null && !Array.isArray(content) ? { ...content } : {}
}

function readMembers(world: SimWorld): Record<string, unknown>[] {
  const { members } = readContent(world, LcuPaths.lobby.lobby)

  return Array.isArray(members) ? members : []
}

describe('SimWorld', () => {
  let world: SimWorld
  let events: SimEvent[]

  beforeEach(() => {
    vi.useFakeTimers()
    world = new SimWorld({ captures, champSelectSession: { localPlayerCellId: 0 } })
    events = []

    world.onEvent((event) => {
      events.push(event)
    })
  })

  afterEach(() => {
    world.dispose()
    vi.useRealTimers()
  })

  it('creates a lobby from the queue the client picked and pushes it', () => {
    expect(world.request('GET', LcuPaths.lobby.lobby).status).toBe(404)

    world.request('POST', LcuPaths.lobby.lobby, { queueId: 480 })

    const lobby = readContent(world, LcuPaths.lobby.lobby)

    expect(world.phase).toBe('Lobby')
    expect(lobby.gameConfig).toMatchObject({ gameMode: 'SWIFTPLAY', queueId: 480, showQuickPlaySlotSelection: true })
    expect(lobby.localMember).toMatchObject({ isLeader: true, summonerId: LOCAL_ID })
    expect(events).toContainEqual(expect.objectContaining({ path: LcuPaths.lobby.lobby, status: 200 }))
    expect(events).toContainEqual({ content: 'Lobby', path: LcuPaths.gameflow.phase, status: 200 })
  })

  it('stores what the local member sets', () => {
    world.request('POST', LcuPaths.lobby.lobby, { queueId: 480 })
    world.request('PUT', LcuPaths.lobby.localMemberPositionPreferences, { firstPreference: 'TOP', secondPreference: 'JUNGLE' })
    world.request('PUT', LcuPaths.lobby.quickplayMemberData, { isPlayerReady: 'true' })

    expect(readContent(world, LcuPaths.lobby.lobby).localMember).toMatchObject({
      firstPositionPreference: 'TOP',
      memberData: { isPlayerReady: 'true' },
      secondPositionPreference: 'JUNGLE',
    })
  })

  it('goes from the queue through the ready check into champ select', () => {
    world.request('POST', LcuPaths.lobby.lobby, { queueId: 480 })
    world.request('POST', LcuPaths.lobby.matchmakingSearch)

    expect(world.phase).toBe('Matchmaking')

    vi.advanceTimersByTime(6500)

    expect(world.phase).toBe('ReadyCheck')

    vi.advanceTimersByTime(3000)

    // The LCU's timer counts the seconds since the pop
    expect(readContent(world, LcuPaths.matchmaking.readyCheck).timer).toBeGreaterThanOrEqual(2.5)

    world.request('POST', LcuPaths.matchmaking.readyCheckAccept)
    vi.advanceTimersByTime(2000)

    expect(readContent(world, LcuPaths.matchmaking.readyCheck)).toMatchObject({
      playerResponse: 'Accepted',
      state: 'EveryoneReady',
    })

    vi.advanceTimersByTime(1000)

    expect(world.phase).toBe('ChampSelect')
    expect(readContent(world, LcuPaths.champSelect.session)).toEqual({ localPlayerCellId: 0 })
    expect(world.request('GET', LcuPaths.matchmaking.search).status).toBe(404)
  })

  it('takes the party out of the queue when nobody answers the ready check', () => {
    world.request('POST', LcuPaths.lobby.lobby, { queueId: 480 })
    world.request('POST', LcuPaths.lobby.matchmakingSearch)
    world.popMatch()
    vi.advanceTimersByTime(READY_CHECK_SECONDS * 1000 + 500)

    expect(world.phase).toBe('Lobby')
    expect(events).toContainEqual({ content: null, path: LcuPaths.matchmaking.readyCheck, status: 404 })
  })

  it('adds an invited friend once they accept', () => {
    world.request('POST', LcuPaths.lobby.lobby, { queueId: 420 })
    world.request('POST', LcuPaths.lobby.invitations, [{ toSummonerId: FRIEND_ID }])

    expect(readMembers(world)).toHaveLength(1)

    vi.advanceTimersByTime(2000)

    expect(
      readMembers(world).map((member) => {
        return member.summonerId
      }),
    ).toEqual([LOCAL_ID, FRIEND_ID])

    expect(readContent(world, LcuPaths.summoner.summoner(FRIEND_ID))).toMatchObject({ gameName: 'Friend', tagLine: 'TAG' })

    // Ranked Solo/Duo holds two
    world.addMember()

    expect(readMembers(world)).toHaveLength(2)
  })

  it('joins the inviter party when accepting an invitation', () => {
    world.receiveInvitation()

    const [invitation] = world.state.receivedInvitations

    world.request('POST', LcuPaths.lobby.receivedInvitationAccept(invitation?.invitationId ?? ''))

    expect(readMembers(world)).toEqual([
      expect.objectContaining({ isLeader: true, summonerId: FRIEND_ID }),
      expect.objectContaining({ isLeader: false, summonerId: LOCAL_ID }),
    ])

    expect(world.request('GET', LcuPaths.lobby.receivedInvitations).content).toEqual([])
  })

  it('answers back what the client PUT on paths it does not model', () => {
    world.request('PUT', LcuPaths.settings.champSelect, { data: { skin: 1 } })

    expect(world.request('GET', LcuPaths.settings.champSelect)).toEqual({ content: { data: { skin: 1 } }, status: 200 })
  })

  it('answers an id it has no capture for with the capture of the same path shape', () => {
    expect(world.request('GET', LcuPaths.perks.recommendedPages(7, 'MIDDLE', 11)).content).toEqual([{ name: 'Annie' }])
    expect(world.request('GET', LcuPaths.perks.recommendedPages(7, 'TOP', 11)).status).toBe(404)
  })
})
