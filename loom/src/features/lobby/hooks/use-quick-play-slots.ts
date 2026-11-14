import { useState } from 'react'

import { LcuPaths } from '@shoma/protocol-contract'
import { useQuery } from '@tanstack/react-query'
import { string } from 'valibot'

import { useSetQuickplayPlayerSlots } from '@/core/lcu/lcu-mutations'
import { parseOrNull } from '@/core/lcu/parsers/base'
import { createLcuQueryOptions, lobbySessionDescriptor, summonerSpellsDescriptor } from '@/core/lcu/queries'
import { useSharedLCUTransport } from '@/core/relay/use-relay-state'

import {
  copySlots,
  filterQuickPlaySpells,
  setSlotChampion,
  setSlotPosition,
  toSlotPerks,
  updateSlot,
} from '../utils/quick-play-slots'

import type { QuickPlaySlot } from '@/core/lcu/parsers/lobby'
import type { PerkPage } from '@/core/lcu/parsers/perks'

// The local player's two Swift Play options and their changes; every change PUTs both, as the client does
export function useQuickPlaySlots() {
  const transport = useSharedLCUTransport()
  const lobbyQuery = useQuery(createLcuQueryOptions(lobbySessionDescriptor, transport))
  const spellsQuery = useQuery(createLcuQueryOptions(summonerSpellsDescriptor, transport))
  const setSlots = useSetQuickplayPlayerSlots()
  const [isReadingRunes, setIsReadingRunes] = useState(false)
  const local = lobbyQuery.data?.members.find((member) => {
    return member.isLocalMember
  })
  const slots = copySlots(local?.quickPlaySlots)
  const spells = filterQuickPlaySpells(spellsQuery.data ?? [])

  function save(next: QuickPlaySlot[], onSaved: () => void) {
    setSlots.mutate(next, { onSuccess: onSaved })
  }

  // The client's last rune page for a champion and position, which it starts a new pick on
  async function readLastPerks(championId: number, position: string): Promise<string | null> {
    const result = await transport?.request(LcuPaths.perks.quickPlaySelection(championId, position)).catch(() => {
      return null
    })

    return result && result.status >= 200 && result.status < 300 ? parseOrNull(string(), result.content) : null
  }

  async function setChampion(
    option: number,
    { championId, skinId }: { championId: number; skinId: number },
    onSaved: () => void,
  ) {
    const isNewChampion = slots[option]?.championId !== championId
    const { slots: next, swapped } = setSlotChampion(slots, option, championId)
    const slot = next[option]

    if (isNewChampion && !swapped && slot) {
      setIsReadingRunes(true)
      slot.perks = (await readLastPerks(championId, slot.positionPreference)) ?? slots[option]?.perks ?? ''
      setIsReadingRunes(false)
    }

    save(updateSlot(next, option, { skinId }), onSaved)
  }

  return {
    error: setSlots.error,
    isPending: setSlots.isPending || isReadingRunes,
    queueId: lobbyQuery.data?.queueId ?? null,
    scarcePositions: lobbyQuery.data?.scarcePositions ?? [],
    setChampion,
    setPerks: (option: number, page: PerkPage, onSaved: () => void) => {
      save(updateSlot(slots, option, { perks: toSlotPerks(page) }), onSaved)
    },
    setPosition: (option: number, position: string, onSaved: () => void) => {
      save(
        setSlotPosition(
          slots,
          { option, position },
          spells.map(({ id }) => {
            return id
          }),
        ),
        onSaved,
      )
    },
    setSpells: (option: number, [spell1, spell2]: readonly [number, number], onSaved: () => void) => {
      save(updateSlot(slots, option, { spell1, spell2 }), onSaved)
    },
    slots,
    spells,
    summonerId: lobbyQuery.data?.localSummonerId ?? null,
  }
}
