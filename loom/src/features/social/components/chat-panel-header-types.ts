import type { Friend } from '../social-types'

export interface ChatPanelHeaderProps {
  selectedFriend: Friend | null
  ddragonVersion: string | undefined
  styles: {
    header: () => string
    headerEmpty: () => string
  }
}
