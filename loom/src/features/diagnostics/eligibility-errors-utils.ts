import { fallback, type GenericSchema, type InferOutput, object, optional, record, safeParse, string, unknown } from 'valibot'

const UnknownRecordSchema = record(string(), unknown())
const AffectedSummonerSchema = object({
  affectedSummoner: fallback(optional(string()), undefined),
  displayName: fallback(optional(string()), undefined),
  fromSummonerName: fallback(optional(string()), undefined),
  playerName: fallback(optional(string()), undefined),
  summonerName: fallback(optional(string()), undefined),
})

export function parseOrNull<const TSchema extends GenericSchema>(
  schema: TSchema,
  content: unknown,
): InferOutput<TSchema> | null {
  const parsed = safeParse(schema, content)

  return parsed.success ? parsed.output : null
}

export function parseObjectOrNull<const TSchema extends GenericSchema>(
  schema: TSchema,
  content: unknown,
): InferOutput<TSchema> | null {
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

  const objectRecord = parseObjectOrNull(UnknownRecordSchema, value)

  if (!objectRecord) {
    return []
  }

  seen.add(value)

  return Object.values(objectRecord).flatMap((entry) => {
    return collectStrings(entry, seen)
  })
}

export function readAffectedSummoner(value: unknown): string | undefined {
  const affectedSummoner = parseObjectOrNull(AffectedSummonerSchema, value)

  if (!affectedSummoner) {
    return undefined
  }

  return (
    readNonEmptyString(affectedSummoner.affectedSummoner) ??
    readNonEmptyString(affectedSummoner.summonerName) ??
    readNonEmptyString(affectedSummoner.displayName) ??
    readNonEmptyString(affectedSummoner.fromSummonerName) ??
    readNonEmptyString(affectedSummoner.playerName) ??
    undefined
  )
}

export function normalizeCandidate(value: string): string {
  return value.trim().toLowerCase()
}
