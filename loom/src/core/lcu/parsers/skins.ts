import { boolean, type InferOutput, object, string } from 'valibot'

import { finiteNumber, parseObjectOrNull, parseOrNull, unknownArray } from './base'

const SkinSchema = object({
  championId: finiteNumber,
  id: finiteNumber,
  name: string(),
  ownership: object({
    owned: boolean(),
  }),
})

export type SkinItem = InferOutput<typeof SkinSchema>

export function parseSkinItem(content: unknown): SkinItem | null {
  return parseObjectOrNull(SkinSchema, content)
}

export function parseSkinInventory(content: unknown): SkinItem[] {
  return (parseOrNull(unknownArray, content) ?? []).flatMap((skin) => {
    const parsed = parseSkinItem(skin)

    return parsed ? [parsed] : []
  })
}
