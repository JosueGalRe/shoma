import { useMemo } from 'react'

import { useCustomGameStore } from '@/features/custom/custom-store'
import { useLobby } from '@/features/lobby'

import type { BotDifficulty, CustomGamePlayer } from '@/features/custom/custom-store';
import type { LobbyMember } from '@/features/lobby/lobby-store'

export const customTeams: CustomGamePlayer['team'][] = ['blue', 'red', 'spectator']

export function useCustomDisplayPlayers(): CustomGamePlayer[] {
  const { viewModel } = useLobby()
  const players = useCustomGameStore((state) => {
    return state.players
  })
  const lobbyPlayers = useMemo(() => {
    return viewModel.members.map(lobbyMemberToCustomPlayer)
  }, [viewModel.members])

  return useMemo(() => {
    return mergeLobbyAndCustomPlayers(lobbyPlayers, players)
  }, [lobbyPlayers, players])
}

function lobbyMemberToCustomPlayer(member: LobbyMember): CustomGamePlayer {
  return {
    id: String(member.summonerId),
    isBot: false,
    name: member.displayName,
    team: 'blue',
  }
}

function mergeLobbyAndCustomPlayers(lobbyPlayers: CustomGamePlayer[], customPlayers: CustomGamePlayer[]): CustomGamePlayer[] {
  const customById = new Map(
    customPlayers.map((player) => {
      return [player.id, player]
    }),
  )
  const mergedLobbyPlayers = lobbyPlayers.map((player) => {
    return customById.get(player.id) ?? player
  })
  const customOnlyPlayers = customPlayers.filter((player) => {
    return (
      player.isBot ||
      !lobbyPlayers.some((lobbyPlayer) => {
        return lobbyPlayer.id === player.id
      })
    )
  })

  return [...mergedLobbyPlayers, ...customOnlyPlayers]
}

export function teamLabel(t: (key: string) => string, team: CustomGamePlayer['team']): string {
  if (team === 'blue') {
    return t('custom.blueTeam')
  }

  if (team === 'red') {
    return t('custom.redTeam')
  }

  return t('custom.spectators')
}

export function difficultyLabel(t: (key: string) => string, difficulty: BotDifficulty): string {
  return t(`custom.difficulties.${difficulty}`)
}
