/// <reference types="bun-types" />

import { describe, expect, test } from 'bun:test'

import { useSendChatMessage } from '../../../src/features/social/hooks/use-send-chat-message'

describe('useSendChatMessage', () => {
  test('exports a function', () => {
    expect(typeof useSendChatMessage).toBe('function')
  })
})
