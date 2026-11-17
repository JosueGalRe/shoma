import { array, boolean, fallback, type InferInput, object, optional, string } from 'valibot'

import { SummonerId } from '@/core/types/branded'

import { finiteNumber, parseObjectOrNull, parseOrNull, unknownArray, unknownRecord } from './base'
import { type LobbyRole, readDisplayName, readRole } from './lobby'

import type { AssertSchemaContract, SchemaContractViolations } from './schema-contract'
import type { LCUTypes } from '@shoma/protocol-contract'

const OptionalBooleanSchema = fallback(optional(boolean()), undefined)
const OptionalNumberSchema = fallback(optional(finiteNumber), undefined)
const OptionalStringSchema = fallback(optional(string()), undefined)
const OptionalArraySchema = fallback(optional(unknownArray), undefined)

const CustomGameConfigSchema = object({
  customLobbyName: OptionalStringSchema,
  customMutatorName: OptionalStringSchema,
  customTeam100: OptionalArraySchema,
  customTeam200: OptionalArraySchema,
  gameMode: OptionalStringSchema,
  isCustom: OptionalBooleanSchema,
  mapId: OptionalNumberSchema,
  maxTeamSize: OptionalNumberSchema,
})

const CustomLobbyPayloadSchema = object({
  gameConfig: fallback(optional(CustomGameConfigSchema), undefined),
})

const ParticipantSchema = object({
  botChampionId: OptionalNumberSchema,
  botPosition: OptionalStringSchema,
  firstPositionPreference: OptionalStringSchema,
  isBot: OptionalBooleanSchema,
  summonerId: OptionalNumberSchema,
})

const AvailableBotSchema = object({
  botDifficulties: fallback(optional(array(string())), undefined),
  id: finiteNumber,
})

export interface CustomLobbySeat {
  // Set for a bot: its champion
  botChampionId: number | null
  name: string
  // A bot's lane, a player's first preference
  position: LobbyRole
  // Set for a player
  summonerId: SummonerId | null
}

export interface CustomLobby {
  gameMode: string
  mapId: number | null
  // The pick strategy, e.g. GAME_CFG_PICK_BLIND
  mutatorName: string | null
  name: string
  teamSize: number
  teams: [CustomLobbySeat[], CustomLobbySeat[]]
}

export interface AvailableBot {
  difficulties: string[]
  id: number
}

function parseTeam(entries: unknown[] = []): CustomLobbySeat[] {
  return entries.flatMap((entry): CustomLobbySeat[] => {
    const participant = parseObjectOrNull(ParticipantSchema, entry)

    if (participant?.isBot === true && participant.botChampionId !== undefined) {
      return [
        {
          botChampionId: participant.botChampionId,
          name: readDisplayName(entry),
          position: readRole(participant.botPosition),
          summonerId: null,
        },
      ]
    }

    if (participant?.summonerId === undefined) {
      return []
    }

    return [
      {
        botChampionId: null,
        name: readDisplayName(entry),
        position: readRole(participant.firstPositionPreference),
        summonerId: SummonerId(participant.summonerId),
      },
    ]
  })
}

// A custom game's lobby (gameConfig.isCustom): its two teams, bots included, as the client draws them; null otherwise
export function parseCustomLobby(content: unknown): CustomLobby | null {
  const config = parseObjectOrNull(CustomLobbyPayloadSchema, content)?.gameConfig

  if (config?.isCustom !== true) {
    return null
  }

  return {
    gameMode: config.gameMode ?? '',
    mapId: config.mapId ?? null,
    mutatorName: config.customMutatorName || null,
    name: config.customLobbyName ?? '',
    teamSize: config.maxTeamSize ?? 5,
    teams: [parseTeam(config.customTeam100), parseTeam(config.customTeam200)],
  }
}

// /lol-lobby/v2/lobby/custom/available-bots: the champions a bot can play, with their difficulties
export function parseAvailableBots(content: unknown): AvailableBot[] {
  return (parseOrNull(unknownArray, content) ?? []).flatMap((entry): AvailableBot[] => {
    const bot = parseObjectOrNull(AvailableBotSchema, entry)

    return bot ? [{ difficulties: bot.botDifficulties ?? [], id: bot.id }] : []
  })
}

// /lol-perks/v1/recommended-champion-positions: each champion's lanes, by champion id
export function parseRecommendedPositions(content: unknown): Record<number, LobbyRole[]> {
  const positions: Record<number, LobbyRole[]> = {}

  for (const [id, entry] of Object.entries(parseOrNull(unknownRecord, content) ?? {})) {
    const lanes = parseOrNull(unknownArray, parseOrNull(unknownRecord, entry)?.recommendedPositions) ?? []

    positions[Number(id)] = lanes.map((lane) => {
      return readRole(lane)
    })
  }

  return positions
}

// Contracts with the generated LCU schema; see ./schema-contract
export type CustomGameConfigSchemaContract = AssertSchemaContract<
  SchemaContractViolations<InferInput<typeof CustomGameConfigSchema>, LCUTypes.LolLobbyLobbyGameConfigDto>
>

export type CustomLobbyParticipantSchemaContract = AssertSchemaContract<
  SchemaContractViolations<InferInput<typeof ParticipantSchema>, LCUTypes.LolLobbyLobbyParticipantDto>
>

export type AvailableBotSchemaContract = AssertSchemaContract<
  SchemaContractViolations<InferInput<typeof AvailableBotSchema>, LCUTypes.LolLobbyLobbyBotChampion>
>
