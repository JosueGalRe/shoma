import type { LobbyRole } from '@/features/lobby/lobby-store'

export interface PositionOptionProps {
  // The line under the name in place of the priority's: Swift Play marks the positions matchmaking is short of
  caption?: string | null
  onToggle: () => void
  // Null while not picked
  priority: 'primary' | 'secondary' | null
  role: LobbyRole
}
