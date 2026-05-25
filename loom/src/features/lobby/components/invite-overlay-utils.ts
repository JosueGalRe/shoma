import { nonEmpty, object, pipe, string } from 'valibot'

import { finiteNumber, parseObjectOrNull, parseOrNull, unknownArray } from '@/core/lcu/parsers/base'

import type { SuggestedPlayer } from './invite-overlay-types'

export const SuggestedPlayerSchema = object({
  summonerId: finiteNumber,
  summonerName: pipe(string(), nonEmpty()),
})

export function parseSuggestedPlayers(content: unknown): SuggestedPlayer[] {
  return (parseOrNull(unknownArray, content) ?? []).flatMap((entry) => {
    const player = parseObjectOrNull(SuggestedPlayerSchema, entry)

    return player ? [player] : []
  })
}
