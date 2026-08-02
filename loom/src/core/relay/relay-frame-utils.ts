import { array, object, safeParse, string, unknown } from 'valibot'

import type { RelayFrame } from './relay-client-types'

const RelayFrameSchema = array(unknown())

export const RelayErrorPayloadSchema = object({
  code: string(),
})

export function parseFrame(raw: unknown): RelayFrame | null {
  if (typeof raw !== 'string') {
    return null
  }

  try {
    const parsed = safeParse(RelayFrameSchema, JSON.parse(raw))

    if (!parsed.success) {
      return null
    }

    const [opcode, ...args] = parsed.output

    return typeof opcode === 'number' ? [opcode, ...args] : null
  } catch {
    return null
  }
}
