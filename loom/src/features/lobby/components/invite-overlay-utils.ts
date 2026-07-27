import { fallback, object, optional, string, union } from 'valibot'

import { finiteNumber, parseObjectOrNull, parseOrNull, unknownArray } from '@/core/lcu/parsers/base'
import { readDisplayName } from '@/core/lcu/parsers/lobby'

import type { SuggestedPlayer } from './invite-overlay-types'

const SuggestedPlayerRecordSchema = object({
  championId: fallback(optional(finiteNumber), undefined),
  gameCreationDate: fallback(optional(string()), undefined),
  summonerId: union([finiteNumber, string()]),
  summonerName: fallback(optional(string()), undefined),
})

function readGameCreationTime(entry: unknown): number {
  const value = parseObjectOrNull(SuggestedPlayerRecordSchema, entry)?.gameCreationDate
  const parsed = value ? Date.parse(value) : Number.NaN

  return Number.isFinite(parsed) ? parsed : 0
}

export function parseSuggestedPlayers(content: unknown): SuggestedPlayer[] {
  const seen = new Set<number>()
  const entries = (parseOrNull(unknownArray, content) ?? []).toSorted((left, right) => {
    return readGameCreationTime(right) - readGameCreationTime(left)
  })

  return entries.flatMap((entry) => {
    const player = parseObjectOrNull(SuggestedPlayerRecordSchema, entry)
    const summonerId = player ? Number(player.summonerId) : Number.NaN

    if (!player || seen.has(summonerId)) {
      return []
    }

    seen.add(summonerId)

    return [{ championId: player.championId, summonerId, summonerName: readDisplayName(entry) }]
  })
}
