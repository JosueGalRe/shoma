import { type ChampSelectMember } from '../champ-select-store'

export interface ChampSelectMembersProps {
  team: ChampSelectMember[]
  enemyTeam: ChampSelectMember[]
}

export interface TeamPanelProps {
  championLabel: string
  emptyLabel: string
  members: ChampSelectMember[]
  title: string
}
