import type { ReactNode } from 'react'

import type { ChampionSortOrder } from './champion-picker-utils'

export interface ChampionPickerBranchProps {
  query: string
  sortOrder: ChampionSortOrder
  activeRoleFilter: string | null
  filters: ReactNode
  t: (key: string, options?: Record<string, unknown>) => string
}
