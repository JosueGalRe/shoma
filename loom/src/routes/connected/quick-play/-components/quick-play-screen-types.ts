import type { ReactNode } from 'react'

import type { SummonerSpell } from '@/core/lcu/queries/summoner'
import type { RoleSlot } from '@/features/lobby/utils/compute-role-preferences'

export interface QuickPlayScreenProps {
  children: ReactNode
  confirmDisabled: boolean
  hasError: boolean
  onConfirm: () => void
  // Under the title, as Select Position names the slot it fills
  subtitle?: string
  title: string
}

// Which of the two options a picker edits, 0 or 1
export interface QuickPlayPickerProps {
  option: number
}

export interface QuickPlaySkinGridProps {
  championId: number
  onPick: (skinId: number) => void
  skinId: number
  summonerId: number | null
}

export interface QuickPlaySpellPickerProps extends QuickPlayPickerProps {
  // The key a pick lands on first: D, or F
  slot: RoleSlot
}

export interface QuickPlaySpellOptionProps {
  // The line under the name while not picked: the level a locked spell unlocks at
  caption: string | null
  infoLabel: string
  locked: boolean
  onInfoClick: () => void
  onPick: () => void
  // The key it is picked for, null while not picked
  slot: RoleSlot | null
  spell: SummonerSpell
  spellIcon: string
}
