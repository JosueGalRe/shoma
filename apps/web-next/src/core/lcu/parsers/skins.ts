import * as v from 'valibot'

import { finiteNumber, parseObjectOrNull, parseOrNull, unknownArray } from './base'

export const SkinSchema = v.object({
  championId: finiteNumber,
  id: finiteNumber,
  name: v.string(),
  ownership: v.object({
    owned: v.boolean(),
  }),
})

export type SkinItem = v.InferOutput<typeof SkinSchema>

export function parseSkinItem(content: unknown): SkinItem | null {
  return parseObjectOrNull(SkinSchema, content)
}

export function parseSkinInventory(content: unknown): SkinItem[] {
  return (parseOrNull(unknownArray, content) ?? []).flatMap((skin) => {
    const parsed = parseSkinItem(skin)
    return parsed ? [parsed] : []
  })
}
