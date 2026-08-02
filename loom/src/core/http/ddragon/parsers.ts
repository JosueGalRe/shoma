import { array, boolean, custom, fallback, type InferOutput, object, pipe, record, string, transform, unknown } from 'valibot'

import { ChampionId, RuneId } from '@/core/types/branded'

import { finiteNumber, parseOrNull } from '../../lcu/parsers/base'

const nonEmptyString = custom<string>((value) => {
  return typeof value === 'string' && value.length > 0
})

const DdragonImageSchema = object({
  full: nonEmptyString,
  group: nonEmptyString,
  h: finiteNumber,
  sprite: nonEmptyString,
  w: finiteNumber,
  x: finiteNumber,
  y: finiteNumber,
})

const ChampionRawSummarySchema = object({
  id: nonEmptyString,
  image: DdragonImageSchema,
  key: nonEmptyString,
  name: nonEmptyString,
  partype: nonEmptyString,
  stats: record(string(), finiteNumber),
  tags: fallback(array(string()), []),
  title: nonEmptyString,
})

const ChampionSummarySchema = object({
  id: pipe(
    finiteNumber,
    transform((value) => {
      return ChampionId(value)
    }),
  ),
  image: DdragonImageSchema,
  key: nonEmptyString,
  name: nonEmptyString,
  partype: nonEmptyString,
  stats: record(string(), finiteNumber),
  tags: array(string()),
  title: nonEmptyString,
})

const ChampionSpellSchema = object({
  description: nonEmptyString,
  id: nonEmptyString,
  image: DdragonImageSchema,
  name: nonEmptyString,
  tooltip: nonEmptyString,
})

const ChampionPassiveSchema = object({
  description: fallback(string(), ''),
  image: DdragonImageSchema,
  name: fallback(string(), ''),
})

const ChampionSkinSchema = object({
  chromas: boolean(),
  id: nonEmptyString,
  name: nonEmptyString,
  num: finiteNumber,
})

const RuneSchema = object({
  icon: nonEmptyString,
  id: pipe(
    finiteNumber,
    transform((value) => {
      return RuneId(value)
    }),
  ),
  key: nonEmptyString,
  longDesc: nonEmptyString,
  name: nonEmptyString,
  shortDesc: nonEmptyString,
})

const RuneTreeSchema = object({
  icon: nonEmptyString,
  id: pipe(
    finiteNumber,
    transform((value) => {
      return RuneId(value)
    }),
  ),
  key: nonEmptyString,
  name: nonEmptyString,
  slots: array(object({ runes: array(RuneSchema) })),
})

const ChampionDetailsRawSchema = object({
  blurb: nonEmptyString,
  lore: nonEmptyString,
  passive: ChampionPassiveSchema,
  skins: fallback(array(unknown()), []),
  spells: fallback(array(unknown()), []),
})

const ChampionPayloadSchema = object({
  data: record(string(), unknown()),
})

export type ChampionSummary = InferOutput<typeof ChampionSummarySchema>
export type ChampionSpell = InferOutput<typeof ChampionSpellSchema>
export type ChampionSkin = InferOutput<typeof ChampionSkinSchema>
export type RuneTree = InferOutput<typeof RuneTreeSchema>

export function parseChampionSummary(entry: unknown): ChampionSummary | null {
  const candidate = parseOrNull(ChampionRawSummarySchema, entry)

  if (!candidate) {
    return null
  }

  const numericId = Number(candidate.key)

  if (!Number.isFinite(numericId)) {
    return null
  }

  return {
    id: ChampionId(numericId),
    image: candidate.image,
    key: candidate.id,
    name: candidate.name,
    partype: candidate.partype,
    stats: candidate.stats,
    tags: candidate.tags,
    title: candidate.title,
  }
}

export function parseChampionDetails(entry: unknown): ChampionDetails | null {
  const summary = parseChampionSummary(entry)
  const raw = parseOrNull(ChampionDetailsRawSchema, entry)

  if (!summary || !raw) {
    return null
  }

  return {
    ...summary,
    blurb: raw.blurb,
    lore: raw.lore,
    passive: raw.passive,
    skins: raw.skins.flatMap((skin) => {
      const parsed = parseOrNull(ChampionSkinSchema, skin)

      return parsed ? [parsed] : []
    }),
    spells: raw.spells.flatMap((spell) => {
      const parsed = parseOrNull(ChampionSpellSchema, spell)

      return parsed ? [parsed] : []
    }),
  }
}

export function parseRuneTree(entry: unknown): RuneTree | null {
  const raw = parseOrNull(
    object({
      icon: nonEmptyString,
      id: finiteNumber,
      key: nonEmptyString,
      name: nonEmptyString,
      slots: fallback(array(unknown()), []),
    }),
    entry,
  )

  if (!raw) {
    return null
  }

  return {
    icon: raw.icon,
    id: RuneId(raw.id),
    key: raw.key,
    name: raw.name,
    slots: raw.slots.flatMap((slot) => {
      const parsedSlot = parseOrNull(object({ runes: fallback(array(unknown()), []) }), slot)

      if (!parsedSlot) {
        return []
      }

      return [
        {
          runes: parsedSlot.runes.flatMap((rune) => {
            const parsed = parseOrNull(RuneSchema, rune)

            return parsed ? [parsed] : []
          }),
        },
      ]
    }),
  }
}

export function parseChampionList(content: unknown): ChampionSummary[] {
  const candidate = parseOrNull(ChampionPayloadSchema, content)

  if (!candidate) {
    return []
  }

  const champions = Object.values(candidate.data).flatMap((value) => {
    const summary = parseChampionSummary(value)

    return summary ? [summary] : []
  })

  champions.sort((left, right) => {
    return left.name.localeCompare(right.name)
  })

  return champions
}

export function parseChampionPayloadEntry(content: unknown, key: string): ChampionDetails | null {
  const candidate = parseOrNull(ChampionPayloadSchema, content)

  if (!candidate) {
    return null
  }

  return parseChampionDetails(candidate.data[key])
}

export type ChampionDetails = ChampionSummary & {
  lore: string
  blurb: string
  passive: {
    name: string
    description: string
    image: InferOutput<typeof DdragonImageSchema>
  }
  spells: ChampionSpell[]
  skins: ChampionSkin[]
}
