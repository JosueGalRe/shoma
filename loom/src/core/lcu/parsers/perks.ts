import { array, boolean, fallback, type InferInput, type InferOutput, object, optional, pipe, string, transform } from 'valibot'

import { RuneId } from '@/core/types/branded'

import { finiteNumber, parseObjectOrNull, parseOrNull, unknownArray } from './base'

import type { AssertSchemaContract, SchemaContractViolations } from './schema-contract'
import type { LCUTypes } from '@shoma/protocol-contract'

const RuneIdSchema = pipe(
  finiteNumber,
  transform((value) => {
    return RuneId(value)
  }),
)

const PerkPageSchema = object({
  id: finiteNumber,
  isActive: boolean(),
  isEditable: boolean(),
  name: string(),
  order: finiteNumber,
  primaryStyleId: RuneIdSchema,
  selectedPerkIds: array(RuneIdSchema),
  subStyleId: RuneIdSchema,
})

export type PerkPage = InferOutput<typeof PerkPageSchema>

export function parsePerkPage(content: unknown): PerkPage | null {
  return parseObjectOrNull(PerkPageSchema, content)
}

export function parsePerkPages(content: unknown): PerkPage[] {
  return (parseOrNull(unknownArray, content) ?? []).flatMap((page) => {
    const parsed = parsePerkPage(page)

    return parsed ? [parsed] : []
  })
}

// Contracts with the generated LCU schema; see ./schema-contract
export type PerkPageSchemaContract = AssertSchemaContract<
  SchemaContractViolations<InferInput<typeof PerkPageSchema>, LCUTypes.LolPerksPerkPageResource>
>

const RecommendedPerkSchema = object({
  id: finiteNumber,
  recommendationDescriptor: fallback(optional(string(), ''), ''),
})

const RecommendedPageSchema = object({
  keystone: RecommendedPerkSchema,
  perks: array(object({ id: finiteNumber })),
  primaryPerkStyleId: finiteNumber,
  recommendationId: fallback(optional(string(), ''), ''),
  secondaryPerkStyleId: finiteNumber,
  summonerSpellIds: fallback(optional(array(finiteNumber), []), []),
})

export interface RecommendedPage {
  // The client's localized summary of the page, e.g. "Ramping attack speed"
  descriptor: string
  id: string
  perkIds: number[]
  primaryStyleId: number
  spellIds: number[]
  subStyleId: number
}

// The client's rune recommender for a champion and position: complete pages, with the spells it suggests beside them
export function parseRecommendedPages(content: unknown): RecommendedPage[] {
  return (parseOrNull(unknownArray, content) ?? []).flatMap((value, index) => {
    const page = parseObjectOrNull(RecommendedPageSchema, value)

    if (!page) {
      return []
    }

    return [
      {
        descriptor: page.keystone.recommendationDescriptor,
        id: page.recommendationId || String(index),
        perkIds: page.perks.map(({ id }) => {
          return id
        }),
        primaryStyleId: page.primaryPerkStyleId,
        spellIds: page.summonerSpellIds,
        subStyleId: page.secondaryPerkStyleId,
      },
    ]
  })
}

export type RecommendedPageSchemaContract = AssertSchemaContract<
  SchemaContractViolations<InferInput<typeof RecommendedPageSchema>, LCUTypes.LolPerksPerkUIRecommendedPage>
>

const PerkStyleSchema = object({
  allowedSubStyles: array(finiteNumber),
  defaultSubStyle: finiteNumber,
  iconPath: string(),
  id: finiteNumber,
  name: string(),
  slots: array(object({ perks: array(finiteNumber), type: string() })),
})

export type PerkStyle = InferOutput<typeof PerkStyleSchema>

// The rune paths, each with its rows: kKeyStone, three kMixedRegularSplashable and three kStatMod (the shards)
export function parsePerkStyles(content: unknown): PerkStyle[] {
  return (parseOrNull(unknownArray, content) ?? []).flatMap((value) => {
    return parseObjectOrNull(PerkStyleSchema, value) ?? []
  })
}

const PerkSchema = object({
  iconPath: string(),
  id: finiteNumber,
  // The client's description with the numbers filled in; HTML
  longDesc: fallback(string(), ''),
  name: string(),
})

export type Perk = InferOutput<typeof PerkSchema>

export function parsePerks(content: unknown): Map<number, Perk> {
  return new Map(
    (parseOrNull(unknownArray, content) ?? []).flatMap((value) => {
      const perk = parseObjectOrNull(PerkSchema, value)

      return perk ? [[perk.id, perk] as const] : []
    }),
  )
}

export type PerkStyleSchemaContract = AssertSchemaContract<
  SchemaContractViolations<InferInput<typeof PerkStyleSchema>, LCUTypes.LolPerksPerkUIStyle>
>

export type PerkSchemaContract = AssertSchemaContract<
  SchemaContractViolations<InferInput<typeof PerkSchema>, LCUTypes.LolPerksPerkUIPerk>
>
