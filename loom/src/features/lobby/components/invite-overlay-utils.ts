import * as v from 'valibot'

import { finiteNumber, parseObjectOrNull, parseOrNull, unknownArray } from '@/core/lcu/parsers/base'

import type { SuggestedPlayer } from './invite-overlay-types'

export const SuggestedPlayerSchema = v.object({
  summonerId: finiteNumber,
  summonerName: v.pipe(v.string(), v.nonEmpty()),
})

export function parseSuggestedPlayers(content: unknown): SuggestedPlayer[] {
  return (parseOrNull(unknownArray, content) ?? []).flatMap((entry) => {
    const player = parseObjectOrNull(SuggestedPlayerSchema, entry)

    return player ? [player] : []
  })
}
