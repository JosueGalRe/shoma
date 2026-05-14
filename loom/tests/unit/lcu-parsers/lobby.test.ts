
import { describe, expect, test } from 'bun:test'

import {
  emptyLobbyQueueStatus,
  parseLobbyInvites,
  parseLobbyMembers,
  parseLobbyMode,
  parseQueueStatus,
  readDisplayName,
  readRole,
} from '../../../src/core/lcu/parsers/lobby'

describe('lcu lobby parsers', () => {
  describe('parseLobbyMembers', () => {
    test('parses members with icon urls, current summoner enrichment, defaults, and sorting', () => {
      const result = parseLobbyMembers(
        {
          localMember: { summonerId: 2 },
          members: [
            {
              allowedInviteOthers: true,
              displayName: 'Charlie',
              firstPositionPreference: 'BOTTOM',
              isLeader: false,
              profileIconId: 33,
              secondPositionPreference: 'UTILITY',
              summonerId: 3,
            },
            {
              allowedInviteOthers: 'yes',
              firstPositionPreference: 'INVALID',
              isLeader: false,
              secondPositionPreference: 'TOP',
              summonerIconId: 22,
              summonerId: 2,
            },
            {
              displayName: 'Alpha',
              firstPositionPreference: 'JUNGLE',
              isLeader: true,
              secondPositionPreference: 'MIDDLE',
              summonerId: 4,
            },
            {
              displayName: 'Bravo',
              isLeader: false,
              summonerId: 5,
            },
            null,
            { displayName: 'No id' },
          ],
        },
        {
          2: '/icons/2.png',
          4: null,
          5: '/icons/5.png',
        },
        { gameName: 'LocalHero', tagLine: 'NA1' },
      )

      expect(result.localSummonerId).toBe(2)
      expect(result.members.map((member) => member.summonerId)).toEqual([2, 4, 5, 3])
      expect(result.members[0]).toEqual({
        allowedInviteOthers: false,
        displayName: 'LocalHero#NA1',
        firstPositionPreference: 'UNSELECTED',
        iconUrl: '/icons/2.png',
        isLeader: false,
        isLocalMember: true,
        profileIconId: 22,
        secondPositionPreference: 'TOP',
        summonerId: 2,
      })
      expect(result.members[1]?.displayName).toBe('Alpha')
      expect(result.members[1]?.isLeader).toBe(true)
      expect(result.members[1]?.iconUrl).toBeNull()
      expect(result.members[2]?.displayName).toBe('Bravo')
      expect(result.members[2]?.iconUrl).toBe('/icons/5.png')
      expect(result.members[3]?.displayName).toBe('Charlie')
    })

    test('returns empty members for missing or malformed content', () => {
      expect(parseLobbyMembers(null, {}, null)).toEqual({ members: [], localSummonerId: null })
      expect(parseLobbyMembers({ members: 'not-array' }, {}, null)).toEqual({ members: [], localSummonerId: null })
    })

    test('honors explicit local member flag when localMember is missing', () => {
      const result = parseLobbyMembers(
        { members: [{ displayName: 'Flagged', isLocalMember: true, summonerId: 9 }] },
        {},
        null,
      )

      expect(result.localSummonerId).toBeNull()
      expect(result.members[0]?.isLocalMember).toBe(true)
    })
  })

  describe('parseQueueStatus', () => {
    test('returns empty status for 404, null, undefined, and malformed payloads', () => {
      expect(parseQueueStatus({ searchState: 'Searching', queueId: 420 }, 404)).toEqual(emptyLobbyQueueStatus)
      expect(parseQueueStatus(null, 200)).toEqual(emptyLobbyQueueStatus)
      expect(parseQueueStatus(undefined, 200)).toEqual(emptyLobbyQueueStatus)
      expect(parseQueueStatus('bad', 200)).toEqual(emptyLobbyQueueStatus)
    })

    test('reads search state and queue id from direct and nested fields', () => {
      expect(parseQueueStatus({ searchState: 'Searching', queueId: 420 }, 200)).toEqual({
        isSearching: true,
        queueId: 420,
        searchState: 'Searching',
      })
      expect(parseQueueStatus({ lobby: { queueId: 440 }, state: 'Found' }, null)).toEqual({
        isSearching: true,
        queueId: 440,
        searchState: 'Found',
      })
    })

    test('treats invalid and error states as not searching', () => {
      expect(parseQueueStatus({ queueId: 420, searchState: 'Invalid' }, 200)).toEqual({
        isSearching: false,
        queueId: 420,
        searchState: 'Invalid',
      })
      expect(parseQueueStatus({ queueId: 420, state: 'Error' }, 200)).toEqual({
        isSearching: false,
        queueId: 420,
        searchState: 'Error',
      })
    })
  })

  describe('parseLobbyMode', () => {
    test('prefers known queue ids over game mode strings', () => {
      expect(parseLobbyMode({ gameConfig: { gameMode: 'ARAM', queueId: 420 } })).toBe('ranked-solo-duo')
    })

    test('reads game modes and falls back to map id or normal draft', () => {
      expect(parseLobbyMode({ gameConfig: { gameMode: 'RANKED_FLEX_SR' } })).toBe('ranked-flex')
      expect(parseLobbyMode({ gameConfig: { gameMode: 'CHERRY' } })).toBe('arena')
      expect(parseLobbyMode({ gameConfig: { gameMode: 'CUSTOM_GAME' } })).toBe('custom')
      expect(parseLobbyMode({ gameConfig: { mapId: 12 } })).toBe('aram')
      expect(parseLobbyMode(null)).toBe('normal-draft')
    })
  })

  describe('parseLobbyInvites', () => {
    test('parses valid invites and filters invalid entries', () => {
      expect(
        parseLobbyInvites([
          { fromSummonerId: 11, fromSummonerName: 'Primary', invitationId: 'invite-1', state: 'Pending' },
          { fromSummonerDisplayName: 'Fallback', id: 'invite-2' },
          { fromSummonerName: 'Missing id' },
          null,
        ]),
      ).toEqual([
        { fromSummonerId: 11, fromSummonerName: 'Primary', id: 'invite-1', state: 'Pending' },
        { fromSummonerId: null, fromSummonerName: 'Fallback', id: 'invite-2', state: null },
      ])
    })

    test('returns empty array for non-array content', () => {
      expect(parseLobbyInvites(null)).toEqual([])
      expect(parseLobbyInvites({ invitationId: 'one' })).toEqual([])
    })
  })

  describe('readRole', () => {
    test('returns known roles and defaults unknown values to unselected', () => {
      expect(readRole('TOP')).toBe('TOP')
      expect(readRole('FILL')).toBe('FILL')
      expect(readRole('')).toBe('UNSELECTED')
      expect(readRole('MID')).toBe('UNSELECTED')
      expect(readRole(null)).toBe('UNSELECTED')
    })
  })

  describe('readDisplayName', () => {
    test('uses supported display name fields and appends tag lines only when needed', () => {
      expect(readDisplayName({ displayName: 'Display', tagLine: 'EUW' })).toBe('Display#EUW')
      expect(readDisplayName({ gameName: 'Game', tagLine: 'NA1' })).toBe('Game#NA1')
      expect(readDisplayName({ name: 'Name#KR1', tagLine: 'KR1' })).toBe('Name#KR1')
      expect(readDisplayName({ summonerName: 'Summoner' })).toBe('Summoner')
      expect(readDisplayName({ displayName: '' })).toBe('Unknown summoner')
      expect(readDisplayName({ displayName: '', summonerName: 'Summoner' })).toBe('Summoner')
      expect(readDisplayName({})).toBe('Unknown summoner')
    })
  })
})
