import type { GameQueue } from '@/core/lcu/parsers/game-queues'
import type { CreateLobbyCategory, CreateLobbyOption, GameMode } from '@/features/lobby/create-lobby-types'

export interface CategoryStepProps {
  category: CreateLobbyCategory
  onCategoryChange: (category: CreateLobbyCategory) => void
}

export interface ModeStepProps {
  modeId: string | undefined
  modes: GameMode[]
  onModeChange: (modeId: string) => void
}

export interface ModeTileProps {
  mode: GameMode
  selected: boolean
}

export interface OptionStepProps {
  onOptionChange: (option: CreateLobbyOption) => void
  option: CreateLobbyOption | undefined
  queues: GameQueue[]
  withPracticeTool: boolean
}
