import { describe, expect, it } from 'vitest'

import { clashTeamTitle, readClashTeams } from './clash-teams'

import type { LcuConversation } from '@/core/lcu/parsers'
import type { ClashChatRoster } from '@/core/lcu/parsers/clash-types'

function conversation(id: string, type: string): LcuConversation {
  return { id, participantNames: [], participantPuuids: [], type, unreadCount: 0 }
}

const roster: ClashChatRoster = {
  iconColorId: 3,
  iconId: 12,
  isRegistered: true,
  multiUserChatId: 'roster-1',
  name: 'Poros de Ventisca',
  shortName: 'poro',
}

describe('readClashTeams', () => {
  it('pairs each clash conversation with the roster its id starts with', () => {
    const teams = readClashTeams(
      [
        conversation('friend@la1.pvp.net', 'chat'),
        conversation('roster-1@sec.la1.pvp.net', 'clash'),
        conversation('gone@sec.la1.pvp.net', 'clash'),
      ],
      [roster],
    )

    expect(teams).toEqual([
      {
        conversationId: 'roster-1@sec.la1.pvp.net',
        logoUrl: expect.stringMatching(/\/assets\/clash\/roster-logos\/12\/3\.png$/u),
        name: 'POROS DE VENTISCA',
        shortName: 'PORO',
      },
    ])

    expect(
      teams.map((team) => {
        return clashTeamTitle(team, 'Pending')
      }),
    ).toEqual(['PORO · POROS DE VENTISCA'])
  })

  it('names a team still forming as pending, without a logo', () => {
    const teams = readClashTeams([conversation('roster-1@sec.la1.pvp.net', 'clash')], [{ ...roster, isRegistered: false }])

    expect(teams).toEqual([expect.objectContaining({ logoUrl: undefined, name: null })])

    expect(
      teams.map((team) => {
        return clashTeamTitle(team, 'Equipo pendiente')
      }),
    ).toEqual(['Equipo pendiente'])
  })
})
