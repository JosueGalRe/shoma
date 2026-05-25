import type { BotDifficulty, CustomGamePlayer } from '@/features/custom/custom-store';


export interface CustomAddBotCardProps {
  botDifficulty: BotDifficulty
  setBotDifficulty: (difficulty: BotDifficulty) => void
  isSpectatorEnabled: boolean
  addBot: (difficulty: BotDifficulty, team: CustomGamePlayer['team']) => void
}
