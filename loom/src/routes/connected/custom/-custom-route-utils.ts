import { botDifficulties, type BotDifficulty } from '@/features/custom/custom-store'

export function isBotDifficulty(value: string): value is BotDifficulty {
  return botDifficulties.some((difficulty) => difficulty === value)
}

export function getModeTranslationKey(mode: string): string {
  if (mode === 'ranked-solo-duo') {
    return 'rankedSoloDuo'
  }

  if (mode === 'ranked-flex') {
    return 'rankedFlex'
  }

  if (mode === 'normal-draft') {
    return 'normalDraft'
  }

  return mode
}
