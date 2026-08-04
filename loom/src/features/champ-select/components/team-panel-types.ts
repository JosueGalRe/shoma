import type { ChampSelectMember } from '../champ-select-actions'

export interface TeamPanelProps {
  championLabel: string
  emptyLabel: string
  members: ChampSelectMember[]
  title: string
}
