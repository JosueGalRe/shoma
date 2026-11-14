import type { ReactNode } from 'react'

export interface QuickPlayScreenProps {
  children: ReactNode
  confirmDisabled: boolean
  hasError: boolean
  onConfirm: () => void
  title: string
}

// Which of the two options a picker edits, 0 or 1
export interface QuickPlayPickerProps {
  option: number
}

export interface QuickPlayChampionGridProps {
  championId: number
  onPick: (championId: number) => void
  queueId: number | null
  summonerId: number | null
}

export interface QuickPlaySkinGridProps {
  championId: number
  onPick: (skinId: number) => void
  skinId: number
  summonerId: number | null
}
