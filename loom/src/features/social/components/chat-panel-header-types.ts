import type { Friend } from '../social-types'

export interface ChatPanelHeaderProps {
  selectedFriend: Friend | null
  conversationTitle?: string
  ddragonVersion: string | undefined
  onBack?: () => void
  styles: {
    header: () => string
    headerBackButton: () => string
    headerEmpty: () => string
    headerGroupIcon: () => string
    headerTitle: () => string
    headerStatus: () => string
  }
}
