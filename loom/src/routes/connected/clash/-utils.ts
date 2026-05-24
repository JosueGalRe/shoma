import type { ClashState } from '@/features/clash/clash-store'

export const phaseLabelKeys = {
  registration: 'clash.title',
  'check-in': 'clash.checkIn',
  'lock-in': 'clash.lockIn',
  scouting: 'clash.scouting',
  bracket: 'clash.bracket',
} as const satisfies Record<ClashState['phase'], string>

export function formatTimer(seconds: number) {
  const safeSeconds = Math.max(0, seconds)
  const minutes = Math.floor(safeSeconds / 60)
  const remainingSeconds = safeSeconds % 60

  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
}
