import { fallback, type InferInput, nonEmpty, object, optional, pipe, record, string } from 'valibot'

import { finiteNumber, parseObjectOrNull, parseOrNull, unknownArray } from './base'

import type { AssertSchemaContract, SchemaContractViolations } from './schema-contract'
import type { LCUTypes } from '@shoma/protocol-contract'

// What the client draws around a player: their banner, prestige border and the challenge tokens they show
export interface PlayerRegalia {
  bannerId: string | null
  // The level of the prestige border they wear; 0 without one, as with a ranked crest
  borderLevel: number
  tokenIconPaths: string[]
}

// A player who never set them sends empty strings and zeros
const PlayerSummarySchema = object({
  bannerId: fallback(optional(pipe(string(), nonEmpty())), undefined),
  prestigeCrestBorderLevel: fallback(optional(finiteNumber), undefined),
  topChallenges: fallback(optional(unknownArray), undefined),
})

const TopChallengeSchema = object({
  currentLevel: string(),
  levelToIconPath: record(string(), string()),
})

const RegaliaSchema = object({
  assetPath: string(),
  id: string(),
  regaliaType: string(),
})

export function parsePlayerRegalia(content: unknown): PlayerRegalia | null {
  const summary = parseObjectOrNull(PlayerSummarySchema, content)

  if (!summary) {
    return null
  }

  return {
    bannerId: summary.bannerId ?? null,
    borderLevel: summary.prestigeCrestBorderLevel ?? 0,
    tokenIconPaths: (summary.topChallenges ?? []).flatMap((entry) => {
      const challenge = parseObjectOrNull(TopChallengeSchema, entry)
      const iconPath = challenge?.levelToIconPath[challenge.currentLevel]

      return iconPath ? [iconPath] : []
    }),
  }
}

// Game data's regalia.json: each banner's art by its id
export function parseBannerSkins(content: unknown): Record<string, string> {
  return Object.fromEntries(
    (parseOrNull(unknownArray, content) ?? []).flatMap((entry): [string, string][] => {
      const regalia = parseObjectOrNull(RegaliaSchema, entry)

      return regalia?.regaliaType === 'kBanner' ? [[regalia.id, regalia.assetPath]] : []
    }),
  )
}

// Contracts with the generated LCU schema; see ./schema-contract
export type PlayerSummarySchemaContract = AssertSchemaContract<
  SchemaContractViolations<InferInput<typeof PlayerSummarySchema>, LCUTypes.LolChallengesUIPlayerSummary>
>

export type TopChallengeSchemaContract = AssertSchemaContract<
  SchemaContractViolations<InferInput<typeof TopChallengeSchema>, LCUTypes.LolChallengesUIChallenge>
>
