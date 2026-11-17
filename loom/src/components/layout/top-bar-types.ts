import type { ReactNode } from 'react'

export interface TopBarProps {
  // Greys out the back arrow, as the lobby does while searching
  backDisabled?: boolean
  onBack?: () => void
  // Shows the gear beside the chat button, as the dashboard does
  onOpenSettings?: () => void
  // Beside the back arrow: the screen's title, as the lobby's mode, or the dashboard's logo. Only the dashboard shows
  // The logo, so the other screens keep its row's room
  title?: ReactNode
}
