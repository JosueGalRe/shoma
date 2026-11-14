import type { GameQueue } from '@/core/lcu/parsers/game-queues'
import type {
  AramMapOption,
  CreateLobbyCategory,
  CreateLobbyOption,
  CustomGameForm,
  GameMode,
} from '@/features/lobby/create-lobby-types'

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

export interface CustomStepProps {
  aramMaps: AramMapOption[]
  form: CustomGameForm
  // The form's name, or the client's default one while it is untouched
  lobbyName: string
  onFormChange: (patch: Partial<CustomGameForm>) => void
  onQueueChange: (queueId: number) => void
  queueId: number | undefined
  queues: GameQueue[]
}

export interface ModeIconVideoProps {
  activeVideo: string
  introVideo?: string
}
