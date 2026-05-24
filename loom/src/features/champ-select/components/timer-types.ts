import type { GameMode } from '@/features/modes/mode-engine'

export interface ChampSelectTimerProps {
  phase: string
  timer: number
  isMyTurn: boolean
  mode: GameMode
}
