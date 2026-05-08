/// <reference types="bun-types" />

import { describe, expect, test } from 'bun:test'

import { findConversationForFriend } from '../../../src/features/social/hooks/use-chat-lcu'
import type { LcuConversation } from '../../../src/core/lcu/parsers'

describe('findConversationForFriend', () => {
  test('finds conversation when friend is a participant', () => {
    const conversations: LcuConversation[] = [
      { id: 'conv-1', type: 'chat', participantNames: ['First', 'Second'], participantPuuids: ['puuid-a', 'puuid-b'] },
      { id: 'conv-2', type: 'chat', participantNames: ['Third'], participantPuuids: ['puuid-c'] },
    ]
    expect(findConversationForFriend(conversations, 'puuid-b')).toEqual({ id: 'conv-1' })
  })

  test('returns undefined when friend has no conversation', () => {
    const conversations: LcuConversation[] = [{ id: 'conv-1', type: 'chat', participantNames: ['First'], participantPuuids: ['puuid-a'] }]
    expect(findConversationForFriend(conversations, 'puuid-x')).toBeUndefined()
  })

  test('returns undefined for empty conversations', () => {
    expect(findConversationForFriend([], 'puuid-a')).toBeUndefined()
  })

  test('finds non-chat typed conversations when the friend id matches', () => {
    const conversations: LcuConversation[] = [{ id: 'conv-1', type: 'groupChat', participantNames: ['First'], participantPuuids: ['puuid-a'] }]
    expect(findConversationForFriend(conversations, 'puuid-a')).toEqual({ id: 'conv-1' })
  })

  test('prefers chat typed conversations when multiple id matches exist', () => {
    const conversations: LcuConversation[] = [
      { id: 'conv-1', type: 'groupChat', participantNames: ['First'], participantPuuids: ['puuid-a'] },
      { id: 'conv-2', type: 'chat', participantNames: ['First'], participantPuuids: ['puuid-a'] },
    ]
    expect(findConversationForFriend(conversations, 'puuid-a')).toEqual({ id: 'conv-2' })
  })

  test('falls back to one-to-one participant name matching', () => {
    const conversations: LcuConversation[] = [
      { id: 'conv-1', type: 'other', participantNames: ['Krynos'], participantPuuids: ['different-id'] },
    ]
    expect(findConversationForFriend(conversations, 'puuid-krynos', 'Krynos')).toEqual({ id: 'conv-1' })
  })

  test('falls back to any id or name match when one-to-one checks fail', () => {
    const conversations: LcuConversation[] = [
      { id: 'conv-1', type: 'groupChat', participantNames: ['Other', 'Krynos', 'Third'], participantPuuids: ['a', 'b', 'c'] },
      { id: 'conv-2', type: 'custom', participantNames: ['First', 'Second', 'Third'], participantPuuids: ['puuid-a', 'puuid-b', 'puuid-c'] },
    ]
    expect(findConversationForFriend(conversations, 'puuid-b', 'Krynos')).toEqual({ id: 'conv-2' })
    expect(findConversationForFriend(conversations, 'missing-id', 'Krynos')).toEqual({ id: 'conv-1' })
  })
})
