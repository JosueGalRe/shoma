import { object, optional, string } from 'valibot'

import { finiteNumber, parseOrNull, unknownArray } from './base'

// @knip
export const ClashTournamentSchema = object({
  nameKey: optional(string()),
  nameKeySecondary: optional(string()),
  scheduleTime: optional(finiteNumber),
  theme: optional(string()),
})

export interface ClashTournament {
  nameKey?: string
  nameKeySecondary?: string
  scheduleTime?: number
  theme?: string
}

export function parseClashTournaments(content: unknown): ClashTournament[] {
  return (parseOrNull(unknownArray, content) ?? []).flatMap((entry): ClashTournament[] => {
    const parsed = parseOrNull(ClashTournamentSchema, entry)

    return parsed ? [parsed] : []
  })
}
