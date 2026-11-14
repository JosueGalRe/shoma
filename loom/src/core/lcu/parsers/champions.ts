import { boolean, fallback, type InferInput, type InferOutput, object, optional, string } from 'valibot'

import { finiteNumber, parseObjectOrNull, parseOrNull, unknownArray } from './base'

import type { AssertSchemaContract, SchemaContractViolations } from './schema-contract'
import type { LCUTypes } from '@shoma/protocol-contract'

const QueueChampionSchema = object({
  freeToPlay: fallback(optional(boolean()), false),
  id: finiteNumber,
  name: string(),
  ownership: object({
    loyaltyReward: fallback(optional(boolean()), false),
    owned: boolean(),
    rental: fallback(optional(object({ rented: boolean() })), undefined),
    xboxGPReward: fallback(optional(boolean()), false),
  }),
})

export type QueueChampion = Pick<InferOutput<typeof QueueChampionSchema>, 'id' | 'name'>

// The champions a player can take into a queue: owned, free this week, rented or lent by Game Pass, by name
export function parseQueueChampions(content: unknown): QueueChampion[] {
  return (parseOrNull(unknownArray, content) ?? [])
    .flatMap((value) => {
      const champion = parseObjectOrNull(QueueChampionSchema, value)

      if (!champion || champion.id <= 0 || !champion.name) {
        return []
      }

      const { loyaltyReward, owned, rental, xboxGPReward } = champion.ownership
      const isPlayable = owned || champion.freeToPlay || loyaltyReward || xboxGPReward || Boolean(rental?.rented)

      return isPlayable ? [{ id: champion.id, name: champion.name }] : []
    })
    .toSorted((first, second) => {
      return first.name.localeCompare(second.name)
    })
}

const ChampionMasterySchema = object({
  championId: finiteNumber,
  championPoints: finiteNumber,
})

// Each champion's mastery points, for sorting the picker by mastery
export function parseChampionMastery(content: unknown): Map<number, number> {
  return new Map(
    (parseOrNull(unknownArray, content) ?? []).flatMap((value) => {
      const mastery = parseObjectOrNull(ChampionMasterySchema, value)

      return mastery ? [[mastery.championId, mastery.championPoints] as const] : []
    }),
  )
}

// Contracts with the generated LCU schema; see ./schema-contract
export type ChampionMasterySchemaContract = AssertSchemaContract<
  SchemaContractViolations<InferInput<typeof ChampionMasterySchema>, LCUTypes.LolChampionMasteryChampionMastery>
>

export type QueueChampionSchemaContract = AssertSchemaContract<
  SchemaContractViolations<InferInput<typeof QueueChampionSchema>, LCUTypes.LolChampionsCollectionsChampionMinimal>
>
