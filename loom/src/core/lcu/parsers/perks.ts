import { array, boolean, type InferInput, type InferOutput, object, pipe, string, transform } from 'valibot'

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
