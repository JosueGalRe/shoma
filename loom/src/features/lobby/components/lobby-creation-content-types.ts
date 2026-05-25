import type { GameQueue } from '@/core/lcu/parsers/game-queues'

export interface GameMode {
  id: string
  nameKey: string
  descriptionKey: string
  iconUrl: string
  iconUrlActive: string
  videoUrlIntro?: string
  videoUrlActive?: string
  queues: GameQueue[]
}

export interface LobbyCreationContentProps {
  onCreated?: () => void | Promise<void>
  showBackToLobby?: boolean
  onBackToLobby?: () => void
}

export type LobbyCreationHeaderProps = Pick<LobbyCreationContentProps, 'showBackToLobby' | 'onBackToLobby'>

export interface LobbyCreationModeCardProps {
  mode: GameMode
  isExpanded: boolean
  onToggle: () => void
  onCreateLobby: (queueId: number) => Promise<void>
  selectedQueueId: number | null
  pendingQueueId: number | null
  isCreatingLobby: boolean
  hasCreateError: boolean
}

export interface LobbyCreationQueueButtonProps {
  queueId: number
  description: string
  index: number
  variant: 'default' | 'expanded' | 'selected' | 'pending' | 'disabled'
  onCreateLobby: (queueId: number) => Promise<void>
}
