import { type InferOutput, object } from 'valibot'

import { finiteNumber, parseObjectOrNull } from '@/core/lcu/parsers/base'

export const GameStatsSchema = object({
  gameTime: finiteNumber,
})

export type GameStats = InferOutput<typeof GameStatsSchema>

export function parseGameStats(content: unknown): GameStats | null {
  return parseObjectOrNull(GameStatsSchema, content)
}
