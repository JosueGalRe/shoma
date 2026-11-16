import type { RoleSlot } from '@/features/lobby/utils/compute-role-preferences'

// The Figma numbers the two options I and II
export function toOptionNumeral(option: number): string {
  return option === 0 ? 'I' : 'II'
}

// A spell picked for one key, as Select Position fills a slot: the other key's spell swaps keys with it, and one already on
// This key stays
export function assignSpell(pair: readonly [number, number], slot: RoleSlot, spellId: number): [number, number] {
  const [first, second] = pair

  if (slot === 'first') {
    return spellId === second ? [second, first] : [spellId, second]
  }

  return spellId === first ? [second, first] : [first, spellId]
}
