import type { GameMode } from '@/core/lcu/parsers/lobby-types'

export interface LobbyBackgroundEffectsProps {
  isSearching: boolean
}

export interface InGameScreenProps {
  mode: GameMode
}
