import type { GameQueue } from '@/core/lcu/parsers/game-queues'

export type GameMode = {
  id: string
  nameKey: string
  descriptionKey: string
  iconUrl: string
  iconUrlActive: string
  videoUrlIntro?: string
  videoUrlActive?: string
  queues: GameQueue[]
}

export type LobbyCreationContentProps = {
  onCreated?: () => void | Promise<void>
  showBackToLobby?: boolean
  onBackToLobby?: () => void
}

export type LobbyCreationHeaderProps = Pick<LobbyCreationContentProps, 'showBackToLobby' | 'onBackToLobby'>

export type LobbyCreationModeCardProps = {
  mode: GameMode
  isExpanded: boolean
  onToggle: () => void
  onCreateLobby: (queueId: number) => Promise<void>
  selectedQueueId: number | null
  pendingQueueId: number | null
  isCreatingLobby: boolean
  hasCreateError: boolean
}

export type LobbyCreationQueueButtonProps = {
  queueId: number
  description: string
  index: number
  isExpanded: boolean
  isSelected: boolean
  isPending: boolean
  isDisabled: boolean
  onCreateLobby: (queueId: number) => Promise<void>
}
