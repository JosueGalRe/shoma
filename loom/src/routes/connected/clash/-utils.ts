import type { ClashState } from '@/features/clash/clash-store'

export const phaseLabelKeys = {
  bracket: 'clash.bracket',
  'check-in': 'clash.checkIn',
  'lock-in': 'clash.lockIn',
  registration: 'clash.title',
  scouting: 'clash.scouting',
} as const satisfies Record<ClashState['phase'], string>
