import type { RuneId as RuneIdType } from '@/core/types/branded'

export interface StatShardGridProps {
  selectedPerkIds: RuneIdType[]
  onSelectStatShard: (slotIndex: number, runeId: RuneIdType) => void
}
