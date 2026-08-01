import { array, boolean, type InferOutput, object, optional, pipe, string, transform } from 'valibot'

import { RuneId } from '@/core/types/branded'

import { finiteNumber, parseObjectOrNull, parseOrNull, unknownArray } from './base'

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
