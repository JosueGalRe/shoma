import * as v from 'valibot'

import { finiteNumber, parseObjectOrNull } from './base'

const OptionalStringSchema = v.fallback(v.optional(v.string()), undefined)

// @knip
export const ReadyCheckSnapshotSchema = v.object({
  playerResponse: OptionalStringSchema,
  state: OptionalStringSchema,
  timer: finiteNumber,
})

export type ReadyCheckSnapshot = v.InferOutput<typeof ReadyCheckSnapshotSchema>

export function parseReadyCheck(content: unknown): ReadyCheckSnapshot | null {
  return parseObjectOrNull(ReadyCheckSnapshotSchema, content)
}
