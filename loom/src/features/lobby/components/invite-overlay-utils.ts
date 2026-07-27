import { fallback, object, optional, string, union } from 'valibot'

import { finiteNumber, parseObjectOrNull, parseOrNull, unknownArray } from '@/core/lcu/parsers/base'
import { readDisplayName } from '@/core/lcu/parsers/lobby'

import type { SuggestedPlayer } from './invite-overlay-types'

const SuggestedPlayerRecordSchema = object({
  summonerId: union([finiteNumber, string()]),
  summonerName: fallback(optional(string()), undefined),
})

export function parseSuggestedPlayers(content: unknown): SuggestedPlayer[] {
  return (parseOrNull(unknownArray, content) ?? []).flatMap((entry) => {
    const player = parseObjectOrNull(SuggestedPlayerRecordSchema, entry)

    if (!player) {
      return []
    }

    return [{ summonerId: Number(player.summonerId), summonerName: readDisplayName(entry) }]
  })
}
