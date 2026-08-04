import type { ChampionId } from '@/core/types/branded'

export interface BenchProps {
  bench: ChampionId[]
  onSwap: (championId: ChampionId) => void
}

export interface BenchItemProps {
  championId: ChampionId
  onSwap: (id: ChampionId) => void
}
