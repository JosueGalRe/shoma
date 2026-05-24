import type { Friend } from '../social-types'

export type ChatPanelHeaderProps = {
  selectedFriend: Friend | null
  ddragonVersion: string | undefined
  styles: {
    header: () => string
    headerEmpty: () => string
  }
}
