import type { ChampionSummary } from '@/core/http/ddragon'
import type { ChampionId as ChampionIdType } from '@/core/types/branded'

export interface ChampionGridCardProps {
  champion: ChampionSummary
  isMyTurn: boolean
  phase: 'pick' | 'ban' | 'waiting'
  selectedChampion: ChampionSummary | null
  bannedChampionIds: ReadonlySet<ChampionIdType>
  pickedChampionIds: ReadonlySet<ChampionIdType>
  allyPickIntents: ReadonlySet<ChampionIdType>
  isLongPressTriggered: { current: boolean }
  onLongPressDown: (championKey: string) => void
  onLongPressUp: () => void
  onShowToast: (message: string) => void
  t: (key: string, options?: { defaultValue: string }) => string
}
