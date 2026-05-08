/// <reference types="bun-types" />

import { describe, expect, test } from 'bun:test'

import { findConversationForFriend } from '../../../src/features/social/hooks/use-chat-lcu'
import type { LcuConversation } from '../../../src/core/lcu/parsers'

describe('findConversationForFriend', () => {
  test('finds conversation when friend is a participant', () => {
    const conversations: LcuConversation[] = [
      { id: 'conv-1', type: 'chat', participantPuuids: ['puuid-a', 'puuid-b'] },
      { id: 'conv-2', type: 'chat', participantPuuids: ['puuid-c'] },
    ]
    expect(findConversationForFriend(conversations, 'puuid-b')).toEqual({ id: 'conv-1' })
  })

  test('returns undefined when friend has no conversation', () => {
    const conversations: LcuConversation[] = [{ id: 'conv-1', type: 'chat', participantPuuids: ['puuid-a'] }]
    expect(findConversationForFriend(conversations, 'puuid-x')).toBeUndefined()
  })

  test('returns undefined for empty conversations', () => {
    expect(findConversationForFriend([], 'puuid-a')).toBeUndefined()
  })

  test('ignores non-chat conversations', () => {
    const conversations: LcuConversation[] = [{ id: 'conv-1', type: 'groupChat', participantPuuids: ['puuid-a'] }]
    expect(findConversationForFriend(conversations, 'puuid-a')).toBeUndefined()
  })
})
