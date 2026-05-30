import { describe, expect, test } from 'vitest'

import { Puuid } from '../../../src/core/types/branded'
import { findConversationForFriend } from '../../../src/features/social/hooks/use-chat-lcu'

import type { LcuConversation } from '../../../src/core/lcu/parsers'

describe('findConversationForFriend', () => {
  test('finds conversation when friend is a participant', () => {
    const conversations: LcuConversation[] = [
      { id: 'conv-1', participantNames: ['First', 'Second'], participantPuuids: ['puuid-a', 'puuid-b'], type: 'chat' },
      { id: 'conv-2', participantNames: ['Third'], participantPuuids: ['puuid-c'], type: 'chat' },
    ]

    expect(findConversationForFriend(conversations, Puuid('puuid-b'))).toEqual({ id: 'conv-1' })
  })

  test('returns undefined when friend has no conversation', () => {
    const conversations: LcuConversation[] = [
      { id: 'conv-1', participantNames: ['First'], participantPuuids: ['puuid-a'], type: 'chat' },
    ]

    expect(findConversationForFriend(conversations, Puuid('puuid-x'))).toBeUndefined()
  })

  test('returns undefined for empty conversations', () => {
    expect(findConversationForFriend([], Puuid('puuid-a'))).toBeUndefined()
  })

  test('finds non-chat typed conversations when the friend id matches', () => {
    const conversations: LcuConversation[] = [
      { id: 'conv-1', participantNames: ['First'], participantPuuids: ['puuid-a'], type: 'groupChat' },
    ]

    expect(findConversationForFriend(conversations, Puuid('puuid-a'))).toEqual({ id: 'conv-1' })
  })

  test('prefers chat typed conversations when multiple id matches exist', () => {
    const conversations: LcuConversation[] = [
      { id: 'conv-1', participantNames: ['First'], participantPuuids: ['puuid-a'], type: 'groupChat' },
      { id: 'conv-2', participantNames: ['First'], participantPuuids: ['puuid-a'], type: 'chat' },
    ]

    expect(findConversationForFriend(conversations, Puuid('puuid-a'))).toEqual({ id: 'conv-2' })
  })

  test('falls back to one-to-one participant name matching', () => {
    const conversations: LcuConversation[] = [
      { id: 'conv-1', participantNames: ['Krynos'], participantPuuids: ['different-id'], type: 'other' },
    ]

    expect(findConversationForFriend(conversations, Puuid('puuid-krynos'), 'Krynos')).toEqual({ id: 'conv-1' })
  })

  test('falls back to any id or name match when one-to-one checks fail', () => {
    const conversations: LcuConversation[] = [
      { id: 'conv-1', participantNames: ['Other', 'Krynos', 'Third'], participantPuuids: ['a', 'b', 'c'], type: 'groupChat' },
      {
        id: 'conv-2',
        participantNames: ['First', 'Second', 'Third'],
        participantPuuids: ['puuid-a', 'puuid-b', 'puuid-c'],
        type: 'custom',
      },
    ]

    expect(findConversationForFriend(conversations, Puuid('puuid-b'), 'Krynos')).toEqual({ id: 'conv-2' })
    expect(findConversationForFriend(conversations, Puuid('missing-id'), 'Krynos')).toEqual({ id: 'conv-1' })
  })
})
