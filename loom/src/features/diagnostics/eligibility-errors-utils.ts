import * as v from 'valibot'

const UnknownRecordSchema = v.record(v.string(), v.unknown())
const AffectedSummonerSchema = v.object({
  affectedSummoner: v.fallback(v.optional(v.string()), undefined),
  displayName: v.fallback(v.optional(v.string()), undefined),
  fromSummonerName: v.fallback(v.optional(v.string()), undefined),
  playerName: v.fallback(v.optional(v.string()), undefined),
  summonerName: v.fallback(v.optional(v.string()), undefined),
})

export function parseOrNull<const TSchema extends v.GenericSchema>(schema: TSchema, content: unknown): v.InferOutput<TSchema> | null {
  const parsed = v.safeParse(schema, content)
  return parsed.success ? parsed.output : null
}

export function parseObjectOrNull<const TSchema extends v.GenericSchema>(
  schema: TSchema,
  content: unknown,
): v.InferOutput<TSchema> | null {
  return parseOrNull(UnknownRecordSchema, content) ? parseOrNull(schema, content) : null
}

export function readNonEmptyString(value: string | undefined): string | null {
  return value && value.trim().length > 0 ? value : null
}

export function collectStrings(value: unknown, seen = new Set<unknown>()): string[] {
  if (typeof value === 'string') {
    return [value]
  }

  if (seen.has(value) || Array.isArray(value)) {
    return []
  }

  const record = parseObjectOrNull(UnknownRecordSchema, value)
  if (!record) {
    return []
  }

  seen.add(value)
  return Object.values(record).flatMap((entry) => collectStrings(entry, seen))
}

export function readAffectedSummoner(value: unknown): string | undefined {
  const record = parseObjectOrNull(AffectedSummonerSchema, value)
  if (!record) {
    return undefined
  }

  return (
    readNonEmptyString(record.affectedSummoner) ??
    readNonEmptyString(record.summonerName) ??
    readNonEmptyString(record.displayName) ??
    readNonEmptyString(record.fromSummonerName) ??
    readNonEmptyString(record.playerName) ??
    undefined
  )
}

export function normalizeCandidate(value: string): string {
  return value.trim().toLowerCase()
}
