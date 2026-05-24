import type { GameMode } from '@/core/lcu/parsers/lobby'

export interface LobbyBackgroundEffectsProps {
  isSearching: boolean
}

export interface InGameScreenProps {
  mode: GameMode
}
