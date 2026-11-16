import { array, boolean, fallback, type InferInput, type InferOutput, object, optional, pipe, regex, string } from 'valibot'

import { finiteNumber, parseObjectOrNull, parseOrNull, unknownArray } from './base'

import type { AssertSchemaContract, SchemaContractViolations } from './schema-contract'
import type { LCUTypes } from '@shoma/protocol-contract'

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

// A recolor of a skin, picked through the same selectedSkinId; its colors paint the client's swatch
const ChromaSchema = object({
  chromaPath: fallback(optional(string(), ''), ''),
  colors: fallback(array(pipe(string(), regex(/^#[\da-f]{6}$/iu))), []),
  disabled: fallback(optional(boolean()), false),
  id: finiteNumber,
  name: string(),
  ownership: object({
    owned: boolean(),
  }),
})

export type SkinChroma = InferOutput<typeof ChromaSchema>

const ChampionSkinSchema = object({
  // The skin's own model render, the one its chromas recolor; empty when it has none
  chromaPath: fallback(optional(string(), ''), ''),
  chromas: fallback(array(ChromaSchema), []),
  disabled: fallback(optional(boolean()), false),
  id: finiteNumber,
  isBase: fallback(optional(boolean()), false),
  name: string(),
  ownership: object({
    owned: boolean(),
  }),
  splashPath: fallback(optional(string(), ''), ''),
  // The square crop of the splash around the champion's face
  tilePath: fallback(optional(string(), ''), ''),
})

export type ChampionSkin = InferOutput<typeof ChampionSkinSchema>

// Every skin of one champion, base first as the client lists them, the ones the player doesn't own included
export function parseChampionSkins(content: unknown): ChampionSkin[] {
  return (parseOrNull(unknownArray, content) ?? []).flatMap((skin) => {
    const parsed = parseObjectOrNull(ChampionSkinSchema, skin)

    if (!parsed || !parsed.name || parsed.disabled) {
      return []
    }

    return [
      {
        ...parsed,
        chromas: parsed.chromas.filter(({ disabled }) => {
          return !disabled
        }),
      },
    ]
  })
}

// The skin a picked id belongs to: the skin itself, or the one a picked chroma recolors
export function findSkinOf(skins: readonly ChampionSkin[], id: number): ChampionSkin | undefined {
  return skins.find((skin) => {
    return (
      skin.id === id ||
      skin.chromas.some((chroma) => {
        return chroma.id === id
      })
    )
  })
}

// A skin the player can take into a game: owned, or the base one everybody has
export function isSkinOwned(skin: ChampionSkin): boolean {
  return skin.ownership.owned || skin.isBase === true
}

// Contracts with the generated LCU schema; see ./schema-contract
export type ChampionSkinSchemaContract = AssertSchemaContract<
  SchemaContractViolations<InferInput<typeof ChampionSkinSchema>, LCUTypes.LolChampionsCollectionsChampionSkin>
>

export type ChromaSchemaContract = AssertSchemaContract<
  SchemaContractViolations<InferInput<typeof ChromaSchema>, LCUTypes.LolChampionsCollectionsChampionChroma>
>

export type SkinSchemaContract = AssertSchemaContract<
  SchemaContractViolations<InferInput<typeof SkinSchema>, LCUTypes.LolChampionsCollectionsChampionSkinMinimal>
>
