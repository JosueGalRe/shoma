import type { BotDifficulty } from '@/features/custom/custom-store'
import type { CustomGamePlayer } from '@/features/custom/custom-store'

export type CustomAddBotCardProps = {
  botDifficulty: BotDifficulty
  setBotDifficulty: (difficulty: BotDifficulty) => void
  isSpectatorEnabled: boolean
  addBot: (difficulty: BotDifficulty, team: CustomGamePlayer['team']) => void
}
