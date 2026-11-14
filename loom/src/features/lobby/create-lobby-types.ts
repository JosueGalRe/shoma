import type { GameQueue } from '@/core/lcu/parsers/game-queues'

export interface GameMode {
  id: string
  nameKey: string
  queues: GameQueue[]
}

// The first step of the create-lobby flow (Figma "Select Categories")
export type CreateLobbyCategory = 'coop' | 'pvp' | 'training'

// A choice of the last step: a queue id, or the practice tool, which the client creates as a custom game
export type CreateLobbyOption = number | 'practice-tool'

export interface UseCreateLobbyModesResult {
  isLoading: boolean
  modes: GameMode[]
}
