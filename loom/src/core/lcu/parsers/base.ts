import * as v from 'valibot'

export const finiteNumber = v.custom<number>((value) => typeof value === 'number' && Number.isFinite(value))
export const unknownArray = v.array(v.unknown())
export const unknownRecord = v.custom<Record<string, unknown>>((value) => typeof value === 'object' && value !== null && !Array.isArray(value))

export function parseOrNull<const TSchema extends v.GenericSchema>(schema: TSchema, content: unknown): v.InferOutput<TSchema> | null {
  const parsed = v.safeParse(schema, content)
  return parsed.success ? parsed.output : null
}

export function parseObjectOrNull<const TSchema extends v.GenericSchema>(schema: TSchema, content: unknown): v.InferOutput<TSchema> | null {
  return parseOrNull(unknownRecord, content) ? parseOrNull(schema, content) : null
}
