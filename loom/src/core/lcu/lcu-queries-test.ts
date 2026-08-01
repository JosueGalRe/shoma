import { describe, expect, test } from 'vitest'

import { lobbySessionDescriptor, sentInvitesDescriptor } from './queries/lobby'
import { parseLcuFriend } from './queries/social'

function createLcuFriend(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    availability: 'chat',
    gameName: 'Player',
    gameTag: 'LAN',
    id: 'puuid-1',
    name: 'Player',
    summonerId: 101,
    ...overrides,
  }
}

describe('parseLcuFriend presence', () => {
  test('maps LCU availability to friend status', () => {
    expect(parseLcuFriend(createLcuFriend({ availability: 'chat' }))?.status).toBe('online')
    expect(parseLcuFriend(createLcuFriend({ availability: 'mobile' }))?.status).toBe('online')
    expect(parseLcuFriend(createLcuFriend({ availability: 'mobile' }))?.isOnMobile).toBe(true)
    expect(parseLcuFriend(createLcuFriend({ availability: 'chat' }))?.isOnMobile).toBe(false)
    expect(parseLcuFriend(createLcuFriend({ product: 'valorant' }))?.product).toBe('valorant')
    expect(parseLcuFriend(createLcuFriend({ availability: 'away' }))?.status).toBe('away')
    expect(parseLcuFriend(createLcuFriend({ availability: 'dnd' }))?.status).toBe('busy')
    expect(parseLcuFriend(createLcuFriend({ availability: 'offline' }))?.status).toBe('offline')
    expect(parseLcuFriend(createLcuFriend({ availability: undefined }))?.status).toBe('offline')
  })

  test('maps LCU game status to friend activity', () => {
    expect(parseLcuFriend(createLcuFriend({ lol: { gameMode: 'ARAM', gameStatus: 'inGame' } }))).toMatchObject({
      activity: 'in-game',
      gameMode: 'ARAM',
    })

    expect(parseLcuFriend(createLcuFriend({ lol: { gameStatus: 'championSelect' } }))).toMatchObject({
      activity: 'champ-select',
    })

    expect(parseLcuFriend(createLcuFriend({ lol: { gameStatus: 'inQueue' } }))).toMatchObject({ activity: 'in-queue' })

    expect(parseLcuFriend(createLcuFriend({ lol: { gameStatus: 'hosting_NORMAL' } }))).toMatchObject({
      activity: 'in-lobby',
    })
  })

  test('leaves activity undefined outside game flows', () => {
    expect(parseLcuFriend(createLcuFriend({ lol: { gameStatus: 'outOfGame' } }))?.activity).toBeUndefined()

    expect(parseLcuFriend(createLcuFriend())?.activity).toBeUndefined()

    expect(parseLcuFriend(createLcuFriend({ lol: 'garbage' }))?.activity).toBeUndefined()
  })
})

describe('lcu query keys', () => {
  test('lobby sub-resources do not collide with the lobby session key', () => {
    expect(sentInvitesDescriptor.queryKey).not.toEqual(lobbySessionDescriptor.queryKey)
    expect(sentInvitesDescriptor.queryKey).toEqual(['lcu', 'lobby', 'session', 'invitations'])
    expect(lobbySessionDescriptor.queryKey).toEqual(['lcu', 'lobby', 'session'])
  })
})
