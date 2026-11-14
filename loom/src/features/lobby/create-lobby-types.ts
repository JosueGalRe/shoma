import type { GameQueue } from '@/core/lcu/parsers/game-queues'
import type { LcuLobbyCustomBody } from '@shoma/protocol-contract'

export interface GameMode {
  icon?: ModeIcon
  id: string
  nameKey: string
  queues: GameQueue[]
}

// A mode's game-select icon as CommunityDragon URLs: the still images, plus the intro and loop the client plays on pick
export interface ModeIcon {
  active: string
  activeVideo?: string
  default: string
  introVideo?: string
}

// The first step of the create-lobby flow (Figma "Select Categories")
export type CreateLobbyCategory = 'coop' | 'custom' | 'pvp' | 'training'

// A choice of the last step: a queue id, or the practice tool, which the client creates as a custom game
export type CreateLobbyOption = number | 'practice-tool'

export type SpectatorPolicy = LcuLobbyCustomBody['customGameLobby']['configuration']['spectatorPolicy']

// Figma "Create Custom", besides the game type, which is the queue; a null name keeps the client's default one
export interface CustomGameForm {
  aramMapMutator: string
  name: string | null
  password: string
  spectatorDelayEnabled: boolean
  spectatorPolicy: SpectatorPolicy
  teamSize: number
}

export interface AramMapOption {
  label: string
  value: string
}

export interface UseCreateLobbyModesResult {
  aramMaps: AramMapOption[]
  customModes: GameMode[]
  isLoading: boolean
  modes: GameMode[]
}
