import type { ReactNode } from 'react'

import type { ChampSelectMember, ChampSelectPhase } from '../champ-select-actions'
import type { ChampionSortOrder } from './champion-picker-utils'
import type { ChampionSummary } from '@/core/http/ddragon'
import type { ChampionId as ChampionIdType } from '@/core/types/branded'

export interface ChampionPickerViewProps {
  aramCards: ChampionIdType[]
  bannedChampions: ChampionIdType[]
  champions: ChampionSummary[]
  enemyTeam: ChampSelectMember[]
  isLoading: boolean
  isMyTurn: boolean
  onSelectChampion: (championId: ChampionIdType) => void
  phase: ChampSelectPhase
  selectedChampionId: ChampionIdType | null
  team: ChampSelectMember[]
}

export interface ChampionPickerBranchProps {
  activeRoleFilter: string | null
  filters: ReactNode
  query: string
  sortOrder: ChampionSortOrder
  t: (key: string, options?: Record<string, unknown>) => string
  view: ChampionPickerViewProps
}
