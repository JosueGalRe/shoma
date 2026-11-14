import type { LobbyRole } from '@/features/lobby/lobby-store'

export interface PositionOptionProps {
  onToggle: () => void
  // Null while not picked
  priority: 'primary' | 'secondary' | null
  role: LobbyRole
}
