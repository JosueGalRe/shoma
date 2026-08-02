import { object, optional, string } from 'valibot'

import { finiteNumber, parseOrNull, unknownArray } from './base'

import type { ClashTournament } from './clash-types'

const ClashTournamentSchema = object({
  nameKey: optional(string()),
  nameKeySecondary: optional(string()),
  scheduleTime: optional(finiteNumber),
  theme: optional(string()),
})

export function parseClashTournaments(content: unknown): ClashTournament[] {
  return (parseOrNull(unknownArray, content) ?? []).flatMap((entry): ClashTournament[] => {
    const parsed = parseOrNull(ClashTournamentSchema, entry)

    return parsed ? [parsed] : []
  })
}
