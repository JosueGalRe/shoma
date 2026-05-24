import type { RuneTree } from '@/core/http/ddragon-client'
import type { RuneId as RuneIdType } from '@/core/types/branded'

export interface SecondaryRuneGridProps {
  secondaryTree: RuneTree
  selectedPerkIds: RuneIdType[]
  onSelectRune: (runeId: RuneIdType) => void
}
