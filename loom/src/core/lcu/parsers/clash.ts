import { object, optional, string } from 'valibot'

import { finiteNumber, parseOrNull, unknownArray } from './base'

import type { ClashTournament } from './clash-types'

const ClashTournamentSchema = object({
  id: optional(finiteNumber),
  nameLocKey: optional(string()),
  nameLocKeySecondary: optional(string()),
  scheduleEndTime: optional(finiteNumber),
  scheduleTime: optional(finiteNumber),
  themeId: optional(finiteNumber),
})

export function parseClashTournaments(content: unknown): ClashTournament[] {
  return (parseOrNull(unknownArray, content) ?? []).flatMap((entry): ClashTournament[] => {
    const parsed = parseOrNull(ClashTournamentSchema, entry)

    return parsed ? [parsed] : []
  })
}
