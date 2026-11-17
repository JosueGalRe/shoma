import type { AvailableBot, CustomLobbySeat } from '@/core/lcu/parsers/custom-lobby'
import type { LobbyRole } from '@/core/lcu/parsers/lobby'

const BOT_POSITIONS: LobbyRole[] = ['TOP', 'JUNGLE', 'MIDDLE', 'BOTTOM', 'UTILITY']

// The client's names for a custom game's pick strategy (rcp-fe-lol-parties CUSTOM_GAME_MUTATOR_NAMES)
const GAME_TYPE_KEYS: Record<string, string> = {
  GAME_CFG_DRAFT_STD: 'createLobby.gameTypes.draft',
  GAME_CFG_DRAFT_TOURNAMENT: 'createLobby.gameTypes.tournament',
  GAME_CFG_PICK_BLIND: 'createLobby.gameTypes.blind',
  GAME_CFG_PICK_RANDOM: 'createLobby.gameTypes.allRandom',
  GAME_CFG_TEAM_BUILDER_BLIND: 'createLobby.gameTypes.blind',
  GAME_CFG_TEAM_BUILDER_DRAFT: 'createLobby.gameTypes.draft',
  GAME_CFG_TEAM_BUILDER_RANDOM: 'createLobby.gameTypes.allRandom',
}

export function getCustomGameTypeKey(mutatorName: string | null): string | undefined {
  return mutatorName ? GAME_TYPE_KEYS[mutatorName] : undefined
}

export interface CustomBotPickInputs {
  bots: AvailableBot[]
  // Each champion's lanes (/lol-perks/v1/recommended-champion-positions)
  positions: Record<number, LobbyRole[]>
  team: CustomLobbySeat[]
}

// As the client's ADD BOT: a random champion not on the team yet for a lane none of its bots plays, at intermediate
// Difficulty when it has one
export function pickCustomBot({ bots, positions, team }: CustomBotPickInputs, random = Math.random) {
  const teamBots = team.filter((seat) => {
    return seat.botChampionId !== null
  })
  const freeLanes = BOT_POSITIONS.filter((lane) => {
    return !teamBots.some((seat) => {
      return seat.position === lane
    })
  })
  const candidates = bots.filter((bot) => {
    return !teamBots.some((seat) => {
      return seat.botChampionId === bot.id
    })
  })
  const fitting = candidates.filter((bot) => {
    return (positions[bot.id] ?? []).some((lane) => {
      return freeLanes.includes(lane)
    })
  })
  const pool = fitting.length > 0 ? fitting : candidates
  const bot = pool[Math.floor(random() * pool.length)]

  if (!bot) {
    return null
  }

  const lanes = positions[bot.id] ?? []

  return {
    championId: bot.id,
    difficulty: bot.difficulties.includes('RSINTERMEDIATE') ? 'RSINTERMEDIATE' : (bot.difficulties[0] ?? 'NONE'),
    position:
      lanes.find((lane) => {
        return freeLanes.includes(lane)
      }) ??
      lanes[0] ??
      'TOP',
  }
}
