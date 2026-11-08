import { type InferInput, object, optional, string } from 'valibot'

import { finiteNumber, parseOrNull, unknownArray } from './base'

import type { ClashTournament } from './clash-types'
import type { AssertSchemaContract, SchemaContractViolations } from './schema-contract'
import type { LCUTypes } from '@shoma/protocol-contract'

const ClashTournamentSchema = object({
  id: optional(finiteNumber),
  nameLocKey: optional(string()),
  nameLocKeySecondary: optional(string()),
  scheduleEndTime: optional(finiteNumber),
  scheduleTime: optional(finiteNumber),
  themeId: optional(finiteNumber),
})

export function parseClashTournaments(content: unknown): ClashTournament[] {
  return (parseOrNull(unknownArray, content) ?? []).flatMap((entry): ClashTournament[] => {
    const parsed = parseOrNull(ClashTournamentSchema, entry)

    return parsed ? [parsed] : []
  })
}

// Contracts with the generated LCU schema; see ./schema-contract
export type ClashTournamentSchemaContract = AssertSchemaContract<
  SchemaContractViolations<InferInput<typeof ClashTournamentSchema>, LCUTypes.TournamentDTO>
>
