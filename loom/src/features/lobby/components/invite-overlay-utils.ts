import { fallback, object, optional, string, union } from 'valibot'

import { finiteNumber, parseObjectOrNull, parseOrNull, unknownArray } from '@/core/lcu/parsers/base'
import { readDisplayName } from '@/core/lcu/parsers/lobby'

import type { SuggestedPlayer } from './invite-overlay-types'

const SuggestedPlayerRecordSchema = object({
  championId: fallback(optional(finiteNumber), undefined),
  summonerId: union([finiteNumber, string()]),
  summonerName: fallback(optional(string()), undefined),
})

export function parseSuggestedPlayers(content: unknown): SuggestedPlayer[] {
  const seen = new Set<number>()

  return (parseOrNull(unknownArray, content) ?? []).flatMap((entry) => {
    const player = parseObjectOrNull(SuggestedPlayerRecordSchema, entry)
    const summonerId = player ? Number(player.summonerId) : Number.NaN

    if (!player || seen.has(summonerId)) {
      return []
    }

    seen.add(summonerId)

    return [{ championId: player.championId, summonerId, summonerName: readDisplayName(entry) }]
  })
}
