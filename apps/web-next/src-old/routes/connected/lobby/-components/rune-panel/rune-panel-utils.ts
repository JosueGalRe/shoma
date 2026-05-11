import type { ConnectedRunePage, RuneStyle } from '../../-lobby-runes'

export function isPrimaryRuneSelected(page: ConnectedRunePage | null, slotIndex: number, runeId: number): boolean {
  if (!page) return false
  const slots = page.selectedPerkIds
  if (!slots || slotIndex >= slots.length) return false
  return slots[slotIndex] === runeId
}

export function isStatShardSelected(page: ConnectedRunePage | null, slotIndex: number, runeId: number): boolean {
  if (!page) return false
  const statSlots = page.statShardIds ?? []
  if (slotIndex >= statSlots.length) return false
  return statSlots[slotIndex] === runeId
}
