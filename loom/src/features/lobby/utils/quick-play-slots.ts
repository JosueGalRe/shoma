import { type QuickPlaySlot, readQuickPlayPerks } from '@/core/lcu/parsers/lobby'

import type { PerkPage } from '@/core/lcu/parsers/perks'
import type { LobbyMember } from '@/features/lobby/lobby-store'

// Swift Play's rules for the two options, as the client's rcp-fe-lol-parties applies them before each PUT of both

const QUICK_PLAY_GAME_MODE = 'SWIFTPLAY'

// The parts of an option the lobby opens a picker for
export const QUICK_PLAY_PARTS = ['champion', 'position', 'rune', 'spells'] as const

export type QuickPlayPart = (typeof QUICK_PLAY_PARTS)[number]

const SPELL = { EXHAUST: 3, FLASH: 4, GHOST: 6, HEAL: 7, IGNITE: 14, SMITE: 11, TELEPORT: 12 } as const

const DEFAULT_SPELL_BY_POSITION: Record<string, number> = {
  BOTTOM: SPELL.HEAL,
  JUNGLE: SPELL.SMITE,
  MIDDLE: SPELL.IGNITE,
  TOP: SPELL.TELEPORT,
  UTILITY: SPELL.EXHAUST,
}

// The summoner spells Swift Play allows
export function filterQuickPlaySpells<Spell extends { gameModes?: string[] }>(spells: readonly Spell[]): Spell[] {
  return spells.filter((spell) => {
    return spell.gameModes?.includes(QUICK_PLAY_GAME_MODE)
  })
}

const EMPTY_SLOT: QuickPlaySlot = {
  championId: 0,
  perks: '',
  positionPreference: 'UNSELECTED',
  skinId: 0,
  spell1: 0,
  spell2: 0,
}

// Both options, copied, so a change never touches the lobby's data
export function copySlots(slots: readonly QuickPlaySlot[] | undefined): QuickPlaySlot[] {
  return [0, 1].map((option) => {
    return { ...(slots?.[option] ?? EMPTY_SLOT) }
  })
}

// A champion the other option holds swaps the two options instead. A new one starts on its base skin; the caller fills
// Its runes from the client's last page for that champion and position
export function setSlotChampion(slots: readonly QuickPlaySlot[], option: number, championId: number) {
  const next = copySlots(slots)

  if (next[1 - option]?.championId === championId) {
    return { slots: next.toReversed(), swapped: true }
  }

  const slot = next[option]

  if (slot && slot.championId !== championId) {
    slot.championId = championId
    slot.skinId = championId * 1000
    slot.perks = ''
  }

  return { slots: next, swapped: false }
}

// A position the other option holds swaps the two positions. Then a jungler takes Smite, and a laner who leaves the
// Jungle trades it for the position's usual spell
export function setSlotPosition(
  slots: readonly QuickPlaySlot[],
  { option, position }: { option: number; position: string },
  spellIds: readonly number[],
): QuickPlaySlot[] {
  const next = copySlots(slots)
  const slot = next[option]
  const other = next[1 - option]

  if (!slot || !other || slot.positionPreference === position) {
    return next
  }

  let dropsSmite: boolean

  if (other.positionPreference === position) {
    other.positionPreference = slot.positionPreference
    slot.positionPreference = position
    dropsSmite = true
  } else {
    slot.positionPreference = position
    dropsSmite = position !== 'JUNGLE'
  }

  for (const each of next) {
    ;[each.spell1, each.spell2] = assignSmite(each, spellIds, dropsSmite)
  }

  return next
}

function assignSmite(slot: QuickPlaySlot, spellIds: readonly number[], dropsSmite: boolean): [number, number] {
  const spells: [number, number] = [slot.spell1, slot.spell2]
  const position = slot.positionPreference
  const hasSmite = spellIds.includes(SPELL.SMITE)

  if (hasSmite && position === 'JUNGLE') {
    if (spells.includes(SPELL.SMITE)) {
      return spells
    }

    return spells[0] === SPELL.FLASH ? [spells[0], SPELL.SMITE] : [SPELL.SMITE, spells[1]]
  }

  const smiteIndex = spells.indexOf(SPELL.SMITE)

  if ((!dropsSmite && hasSmite) || smiteIndex === -1) {
    return spells
  }

  const preferred = [DEFAULT_SPELL_BY_POSITION[position], SPELL.HEAL, SPELL.FLASH, SPELL.GHOST]
  const replacement = preferred.find((spellId) => {
    return spellId !== undefined && spellIds.includes(spellId) && !spells.includes(spellId)
  })

  if (replacement === undefined) {
    return spells
  }

  const next: [number, number] = [...spells]

  next[smiteIndex] = replacement

  return next
}

export function updateSlot(slots: readonly QuickPlaySlot[], option: number, patch: Partial<QuickPlaySlot>): QuickPlaySlot[] {
  return copySlots(slots).map((slot, index) => {
    return index === option ? { ...slot, ...patch } : slot
  })
}

// The perks string the client stores for a rune page
export function toSlotPerks(page: Pick<PerkPage, 'primaryStyleId' | 'selectedPerkIds' | 'subStyleId'>): string {
  return JSON.stringify({ perkIds: page.selectedPerkIds, perkStyle: page.primaryStyleId, perkSubStyle: page.subStyleId })
}

// The rune page whose styles and perks an option carries
export function findSlotPerkPage(perks: string, pages: readonly PerkPage[]): PerkPage | undefined {
  const current = readQuickPlayPerks(perks)

  return pages.find((page) => {
    return (
      current !== null &&
      page.primaryStyleId === current.perkStyle &&
      page.subStyleId === current.perkSubStyle &&
      page.selectedPerkIds.length === current.perkIds.length &&
      page.selectedPerkIds.every((perkId, index) => {
        return perkId === current.perkIds[index]
      })
    )
  })
}

export interface QuickPlayAction {
  disabled: boolean
  // A member of a party readies up; the leader, or a player alone, finds the match
  kind: 'find-match' | 'ready'
  playersReady: number
}

// The client's Swift Play button: nothing without a first champion. A member readies once; the leader waits until
// Everyone else is ready
export function getQuickPlayAction(members: readonly LobbyMember[]): QuickPlayAction {
  const local = members.find((member) => {
    return member.isLocalMember
  })
  const isLeader = local?.isLeader ?? false
  const isReady = local?.isQuickPlayReady ?? false
  const isPartyReady = members.every((member) => {
    return member.isLocalMember || member.isQuickPlayReady
  })
  const hasChampion = (local?.quickPlaySlots?.[0]?.championId ?? 0) > 0

  return {
    disabled: !hasChampion || (isReady && !isLeader) || (isLeader && !isPartyReady),
    kind: members.length > 1 && !isLeader ? 'ready' : 'find-match',
    playersReady: members.filter((member) => {
      return member.isQuickPlayReady
    }).length,
  }
}
