import type { RuneTree } from '@/core/http/ddragon'
import type { RuneId as RuneIdType } from '@/core/types/branded'

export interface PrimaryRuneGridProps {
  primaryTree: RuneTree
  selectedPerkIds: RuneIdType[]
  onSelectRune: (slotIndex: number, runeId: RuneIdType) => void
}
