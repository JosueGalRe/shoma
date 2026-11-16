import { describe, expect, it } from 'bun:test'

import { LcuPathPatterns, LcuPaths } from '../src/index'

describe('LCU path contracts', () => {
  it('keeps explicit received invitation actions aligned with LCU OpenAPI', () => {
    expect(LcuPaths.lobby.receivedInvitationAccept('invite-1')).toBe('/lol-lobby/v2/received-invitations/invite-1/accept')
    expect(LcuPaths.lobby.receivedInvitationDecline('invite-1')).toBe('/lol-lobby/v2/received-invitations/invite-1/decline')
  })

  it('builds champion trade calls on the session trade id, as the sim routes them', () => {
    expect(LcuPaths.champSelect.championSwap(3, 'request')).toBe('/lol-champ-select/v1/session/champion-swaps/3/request')
    expect(LcuPaths.champSelect.championSwap(3, 'decline')).toBe('/lol-champ-select/v1/session/champion-swaps/3/decline')
  })

  it('matches cache invalidation update paths', () => {
    expect(LcuPathPatterns.gameQueue.exec('/lol-game-queues/v1/queues/430')?.[1]).toBe('430')
    expect(LcuPathPatterns.map.exec('/lol-maps/v1/map/11')?.[1]).toBe('11')
  })
})
