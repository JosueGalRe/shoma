import { describe, expect, test } from 'vitest'

import { parseLcuConversationMessages, parseLcuConversations } from '../../../src/core/lcu/parsers/chat'

describe('lcu chat parsers', () => {
  describe('parseLcuConversations', () => {
    test('parses valid conversations with participant puuids', () => {
      expect(
        parseLcuConversations([
          {
            id: 'conversation-1',
            lastMessage: { body: 'hello' },
            participants: [
              { id: 'puuid-1', name: 'First' },
              { id: 'puuid-2', name: 'Second' },
            ],
            type: 'chat',
            unreadCount: 2,
          },
          {
            id: 'conversation-2',
            participants: [],
            type: 'groupChat',
          },
        ]),
      ).toEqual([
        {
          id: 'conversation-1',
          lastMessage: 'hello',
          participantNames: ['First', 'Second'],
          participantPuuids: ['puuid-1', 'puuid-2'],
          type: 'chat',
          unreadCount: 2,
        },
        { id: 'conversation-2', participantNames: [], participantPuuids: [], type: 'groupChat', unreadCount: 0 },
      ])
    })

    test('parses string participant puuids without names', () => {
      expect(
        parseLcuConversations([
          {
            id: 'conversation-1',
            participants: ['puuid-1', 'puuid-2'],
            type: 'chat',
          },
        ]),
      ).toEqual([
        { id: 'conversation-1', participantNames: [], participantPuuids: ['puuid-1', 'puuid-2'], type: 'chat', unreadCount: 0 },
      ])
    })

    test('prefers unreadMessageCount from the LCU payload', () => {
      expect(
        parseLcuConversations([
          { id: 'conversation-1', participants: [], type: 'chat', unreadCount: 1, unreadMessageCount: 3 },
        ]),
      ).toEqual([
        { id: 'conversation-1', participantNames: [], participantPuuids: [], type: 'chat', unreadCount: 3 },
      ])
    })


    test('handles empty and non-array content as empty conversations', () => {
      expect(parseLcuConversations([])).toEqual([])
      expect(parseLcuConversations(null)).toEqual([])
      expect(parseLcuConversations({ id: 'conversation-1' })).toEqual([])
    })

    test('skips malformed conversations and malformed participants', () => {
      expect(
        parseLcuConversations([
          { id: 'conversation-1', participants: [{ id: 'puuid-1' }, { id: 2 }, null], type: 'chat' },
          { id: 'missing-type', participants: [{ id: 'puuid-2' }] },
          { participants: [{ id: 'puuid-3' }], type: 'chat' },
          null,
        ]),
      ).toEqual([
        { id: 'conversation-1', participantNames: [], participantPuuids: ['puuid-1'], type: 'chat', unreadCount: 0 },
      ])
    })
  })

  describe('parseLcuConversationMessages', () => {
    test('parses valid messages with numeric and ISO timestamps', () => {
      expect(
        parseLcuConversationMessages([
          {
            body: 'hello',
            fromId: 'summoner-1',
            fromPuuid: 'puuid-1',
            id: 'message-1',
            timestamp: 1_714_544_400_000,
          },
          {
            body: 'there',
            fromId: 'summoner-2',
            fromPuuid: 'puuid-2',
            id: 'message-2',
            timestamp: '2024-05-01T10:00:00.000Z',
          },
        ]),
      ).toEqual([
        { body: 'hello', fromPuuid: 'puuid-1', id: 'message-1', timestamp: 1_714_544_400_000, type: '' },
        { body: 'there', fromPuuid: 'puuid-2', id: 'message-2', timestamp: 1_714_557_600_000, type: '' },
      ])
    })

    test('handles empty and non-array content as empty messages', () => {
      expect(parseLcuConversationMessages([])).toEqual([])
      expect(parseLcuConversationMessages(undefined)).toEqual([])
      expect(parseLcuConversationMessages({ id: 'message-1' })).toEqual([])
    })

    test('skips malformed messages in mixed payloads', () => {
      expect(
        parseLcuConversationMessages([
          { body: 'valid', fromPuuid: 'puuid-1', id: 'message-1', timestamp: '2024-05-01T10:00:00.000Z' },
          { body: 'bad timestamp', fromPuuid: 'puuid-2', id: 'message-2', timestamp: 'not-a-date' },
          { body: 'missing puuid', id: 'message-3', timestamp: 1 },
          { fromPuuid: 'puuid-4', id: 'message-4', timestamp: 1 },
          null,
        ]),
      ).toEqual([
        { body: 'valid', fromPuuid: 'puuid-1', id: 'message-1', timestamp: 1_714_557_600_000, type: '' },
        { body: 'missing puuid', fromPuuid: '', id: 'message-3', timestamp: 1, type: '' },
      ])
    })
  })
})
