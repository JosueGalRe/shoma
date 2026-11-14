import { useState } from 'react'

import { create, props } from '@stylexjs/stylex'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'

import { createLcuQueryOptions, currentSummonerDescriptor } from '@/core/lcu/queries'
import { useSharedLCUTransport } from '@/core/relay/use-relay-state'
import { useQuickPlaySlots } from '@/features/lobby/hooks/use-quick-play-slots'
import { resolveSpellIcon } from '@/lib/asset-resolver'

import { QuickPlayInfoSheet } from './quick-play-info-sheet'
import { QuickPlayScreen } from './quick-play-screen'
import { assignSpell } from './quick-play-screen-utils'
import { QuickPlaySpellOption } from './quick-play-spell-option'

import type { QuickPlaySpellPickerProps } from './quick-play-screen-types'
import type { SummonerSpell } from '@/core/lcu/queries/summoner'
import type { RoleSlot } from '@/features/lobby/utils/compute-role-preferences'

const SLOT_INDEX = { first: 0, second: 1 } as const

// Figma "Spells Selection", laid out as Select Position: the option's two summoner spells by key. A pick lands on the key
// Whose spell opened the screen, then moves on to the other while that one is empty; the other key's spell swaps keys with
// It. Spells above the player's level are locked, as the client locks them
export function QuickPlaySpellScreen({ option, slot: openedSlot }: QuickPlaySpellPickerProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const transport = useSharedLCUTransport()
  const quickPlay = useQuickPlaySlots()
  const level = useQuery(createLcuQueryOptions(currentSummonerDescriptor, transport)).data?.summonerLevel
  const summonerLevel = typeof level === 'number' ? level : null
  // Kept after closing, so the sheet keeps its text while it slides away
  const [info, setInfo] = useState<SummonerSpell>()
  const [isInfoOpen, setIsInfoOpen] = useState(false)
  const saved = quickPlay.slots[option]
  const [picked, setPicked] = useState<[number, number]>([saved?.spell1 ?? 0, saved?.spell2 ?? 0])
  const [slot, setSlot] = useState<RoleSlot>(openedSlot)

  function isLocked(spell: SummonerSpell) {
    return summonerLevel !== null && (spell.summonerLevel ?? 0) > summonerLevel
  }

  function goToLobby() {
    void navigate({ to: '/connected/lobby' })
  }

  function handlePick(spellId: number) {
    const next = assignSpell(picked, slot, spellId)
    const other = slot === 'first' ? 'second' : 'first'

    setPicked(next)

    if (next[SLOT_INDEX[other]] === 0) {
      setSlot(other)
    }
  }

  function readSlot(spellId: number): RoleSlot | null {
    if (spellId === picked[0]) {
      return 'first'
    }

    return spellId === picked[1] ? 'second' : null
  }

  return (
    <QuickPlayScreen
      confirmDisabled={picked.includes(0) || quickPlay.isPending}
      hasError={quickPlay.error !== null}
      subtitle={t(slot === 'first' ? 'lobby.quickPlay.spellD' : 'lobby.quickPlay.spellF')}
      title={t('lobby.quickPlay.selectSpells')}
      onConfirm={() => {
        if (picked[0] === saved?.spell1 && picked[1] === saved.spell2) {
          goToLobby()

          return
        }

        quickPlay.setSpells(option, picked, goToLobby)
      }}
    >
      <div role="group" aria-label={t('lobby.quickPlay.spells')} {...props(styles.grid)}>
        {quickPlay.spells.map((spell) => {
          const locked = isLocked(spell)

          return (
            <QuickPlaySpellOption
              key={spell.id}
              caption={locked ? t('lobby.quickPlay.levelLock', { level: spell.summonerLevel }) : null}
              infoLabel={t('lobby.quickPlay.aboutSpell', { name: spell.name })}
              locked={locked}
              slot={readSlot(spell.id)}
              spell={spell}
              spellIcon={resolveSpellIcon(spell.id, quickPlay.spells)}
              onInfoClick={() => {
                setInfo(spell)
                setIsInfoOpen(true)
              }}
              onPick={() => {
                handlePick(spell.id)
              }}
            />
          )
        })}
      </div>

      <QuickPlayInfoSheet
        body={[
          info?.description,
          info && isLocked(info) ? t('lobby.quickPlay.unlocksAtLevel', { level: info.summonerLevel }) : undefined,
        ]
          .filter(Boolean)
          .join('\n\n')}
        open={isInfoOpen}
        title={info?.name ?? ''}
        onOpenChange={setIsInfoOpen}
      />
    </QuickPlayScreen>
  )
}

const styles = create({
  // Three to a row, the way Select Position sets its lanes two to a row
  grid: {
    columnGap: 8,
    display: 'grid',
    gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
    rowGap: 16,
  },
})
