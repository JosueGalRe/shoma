import { fallback, type InferOutput, object, optional, string } from 'valibot'

import { finiteNumber, parseObjectOrNull } from './base'

const OptionalStringSchema = fallback(optional(string()), undefined)

// @knip
export const ReadyCheckSnapshotSchema = object({
  playerResponse: OptionalStringSchema,
  state: OptionalStringSchema,
  timer: finiteNumber,
})

export type ReadyCheckSnapshot = InferOutput<typeof ReadyCheckSnapshotSchema>

export function parseReadyCheck(content: unknown): ReadyCheckSnapshot | null {
  return parseObjectOrNull(ReadyCheckSnapshotSchema, content)
}
