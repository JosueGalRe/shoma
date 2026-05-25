import * as v from 'valibot'

import { RuneId } from '@/core/types/branded'

import { finiteNumber, parseObjectOrNull, parseOrNull, unknownArray } from './base'

const RuneIdSchema = v.pipe(
  finiteNumber,
  v.transform((value) => {
    return RuneId(value)
  }),
)

// @knip
export const PerkPageSchema = v.object({
  id: finiteNumber,
  isActive: v.boolean(),
  isEditable: v.boolean(),
  name: v.string(),
  order: finiteNumber,
  primaryStyleId: RuneIdSchema,
  selectedPerkIds: v.array(RuneIdSchema),
  subStyleId: RuneIdSchema,
})

// @knip
export const PerkStyleSchema = v.object({
  iconPath: v.optional(v.string()),
  id: RuneIdSchema,
  name: v.string(),
  tooltip: v.optional(v.string()),
})

export type PerkPage = v.InferOutput<typeof PerkPageSchema>
// @knip
export type PerkStyle = v.InferOutput<typeof PerkStyleSchema>

export function parsePerkPage(content: unknown): PerkPage | null {
  return parseObjectOrNull(PerkPageSchema, content)
}

export function parsePerkPages(content: unknown): PerkPage[] {
  return (parseOrNull(unknownArray, content) ?? []).flatMap((page) => {
    const parsed = parsePerkPage(page)

    return parsed ? [parsed] : []
  })
}
