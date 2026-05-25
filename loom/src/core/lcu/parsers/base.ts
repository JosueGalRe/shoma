import { array, custom, type GenericSchema, type InferOutput, safeParse, unknown } from 'valibot'

export const finiteNumber = custom<number>((value) => {
  return typeof value === 'number' && Number.isFinite(value)
})
export const unknownArray = array(unknown())
export const unknownRecord = custom<Record<string, unknown>>((value) => {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
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
  return parseOrNull(unknownRecord, content) ? parseOrNull(schema, content) : null
}
