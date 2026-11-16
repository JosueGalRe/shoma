import { describe, expect, it } from 'vitest'

import { formatChatTime, readUnreadCounts, startsChatStretch } from './chat-utils'

import type { LcuConversation } from '@/core/lcu/parsers'

function conversation(id: string, unreadCount: number, extra: Partial<LcuConversation> = {}): LcuConversation {
  return { id, participantNames: [], participantPuuids: [], type: 'chat', unreadCount, ...extra }
}

describe('readUnreadCounts', () => {
  it('counts the conversations the client badges, leaving muted ones and game rooms out', () => {
    const counts = readUnreadCounts([
      conversation('friend@la1.pvp.net', 2),
      conversation('read@la1.pvp.net', 0),
      conversation('muted@la1.pvp.net', 3, { isMuted: true }),
      conversation('lobby@champ-select.la1.pvp.net', 4, { type: 'championSelect' }),
      conversation('room@sec.la1.pvp.net', 1, { type: 'private' }),
    ])

    expect([...counts]).toEqual([
      ['friend@la1.pvp.net', 2],
      ['room@sec.la1.pvp.net', 1],
    ])
  })
})

describe('chat times', () => {
  const now = new Date(2026, 10, 16, 18, 0).getTime()

  it('starts a stretch on the first message, a new day or after 15 minutes of silence', () => {
    const at = new Date(2026, 10, 16, 14, 31).getTime()

    expect(startsChatStretch(undefined, at)).toBe(true)
    expect(startsChatStretch(at, at + 14 * 60_000)).toBe(false)
    expect(startsChatStretch(at, at + 15 * 60_000)).toBe(true)
    expect(startsChatStretch(new Date(2026, 10, 15, 23, 55).getTime(), new Date(2026, 10, 16, 0, 1).getTime())).toBe(true)
  })

  it('names today and yesterday, and dates the rest', () => {
    expect(formatChatTime(new Date(2026, 10, 16, 14, 31).getTime(), now, 'es')).toBe('Hoy, 14:31')
    expect(formatChatTime(new Date(2026, 10, 15, 9, 5).getTime(), now, 'es')).toBe('Ayer, 9:05')
    expect(formatChatTime(new Date(2026, 10, 12, 18, 40).getTime(), now, 'es')).toBe('12 nov, 18:40')
    expect(formatChatTime(new Date(2025, 11, 31, 23, 0).getTime(), now, 'es')).toBe('31 dic 2025, 23:00')
  })
})
