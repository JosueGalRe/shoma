import type { ChampSelectMember } from '../champ-select-store'

export interface TeamPanelProps {
  championLabel: string
  emptyLabel: string
  members: ChampSelectMember[]
  title: string
}
