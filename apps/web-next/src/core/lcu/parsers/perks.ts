import * as v from 'valibot'

import { RuneId } from '@/core/types/branded'

import { finiteNumber, parseObjectOrNull, parseOrNull, unknownArray } from './base'

const RuneIdSchema = v.pipe(finiteNumber, v.transform((value) => RuneId(value)))

export const PerkPageSchema = v.object({
  id: finiteNumber,
  name: v.string(),
  isEditable: v.boolean(),
  isActive: v.boolean(),
  order: finiteNumber,
  primaryStyleId: RuneIdSchema,
  subStyleId: RuneIdSchema,
  selectedPerkIds: v.array(RuneIdSchema),
})

export const PerkStyleSchema = v.object({
  id: RuneIdSchema,
  name: v.string(),
  iconPath: v.optional(v.string()),
  tooltip: v.optional(v.string()),
})

export type PerkPage = v.InferOutput<typeof PerkPageSchema>
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
