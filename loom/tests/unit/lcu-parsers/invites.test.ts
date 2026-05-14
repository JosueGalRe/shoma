
import { describe, expect, test } from 'bun:test'

import { parseInvites } from '../../../src/core/lcu/parsers/invites'

describe('lcu invites parser', () => {
  test('parses invites with direct and fallback id, mode, and inviter fields', () => {
    expect(
      parseInvites([
        { gameMode: 'RANKED', id: 'one', inviterName: 'Primary' },
        { fromSummonerName: 'Summoner', gameConfig: { gameMode: 'ARAM' }, invitationId: 'two' },
        { fromDisplayName: 'Display', gameConfig: { queueId: 420 }, inviteId: 'three' },
        { fromName: 'FromName', gameConfig: { mapId: 12 }, id: 'four' },
        { id: 'five', mapId: 11 },
      ]),
    ).toEqual([
      { gameMode: 'RANKED', id: 'one', inviterName: 'Primary' },
      { gameMode: 'ARAM', id: 'two', inviterName: 'Summoner' },
      { gameMode: 'Queue 420', id: 'three', inviterName: 'Display' },
      { gameMode: 'Map 12', id: 'four', inviterName: 'FromName' },
      { gameMode: 'Map 11', id: 'five', inviterName: 'Unknown player' },
    ])
  })

  test('trims strings and skips entries without usable ids', () => {
    expect(
      parseInvites([
        { gameMode: '  SWIFTPLAY  ', id: '  kept  ', inviterName: '  Friend  ' },
        { gameMode: 'ARAM', id: '' },
        { invitationId: '   ', inviterName: 'Nobody' },
        null,
      ]),
    ).toEqual([{ gameMode: 'SWIFTPLAY', id: 'kept', inviterName: 'Friend' }])
  })

  test('falls back to unknown mode and unknown player for sparse valid invites', () => {
    expect(parseInvites([{ id: 'sparse' }])).toEqual([
      { gameMode: 'Unknown mode', id: 'sparse', inviterName: 'Unknown player' },
    ])
  })

  test('returns empty array for non-array content and empty arrays', () => {
    expect(parseInvites(null)).toEqual([])
    expect(parseInvites(undefined)).toEqual([])
    expect(parseInvites({ id: 'one' })).toEqual([])
    expect(parseInvites([])).toEqual([])
  })
})
