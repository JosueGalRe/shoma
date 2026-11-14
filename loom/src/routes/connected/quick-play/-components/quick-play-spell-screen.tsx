import { useState } from 'react'

import { text } from '@shoma/ui/text'
import { Tile, TileGroup } from '@shoma/ui/tile'
import { color } from '@shoma/ui/tokens/color.stylex'
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

import type { QuickPlayPickerProps } from './quick-play-screen-types'
import type { SummonerSpell } from '@/core/lcu/queries/summoner'

// Figma "Spells Selection": two of Swift Play's summoner spells. Each keeps its key (D or F): dropping one frees its
// Place for the next pick, and a third waits until one is dropped. Spells above the player's level are locked, as
// The client locks them
export function QuickPlaySpellScreen({ option }: QuickPlayPickerProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const transport = useSharedLCUTransport()
  const quickPlay = useQuickPlaySlots()
  const level = useQuery(createLcuQueryOptions(currentSummonerDescriptor, transport)).data?.summonerLevel
  const summonerLevel = typeof level === 'number' ? level : null
  // Kept after closing, so the sheet keeps its text while it slides away
  const [info, setInfo] = useState<SummonerSpell>()
  const [isInfoOpen, setIsInfoOpen] = useState(false)
  const slot = quickPlay.slots[option]
  const [picked, setPicked] = useState<[number, number]>([slot?.spell1 ?? 0, slot?.spell2 ?? 0])
  const count = picked.filter((spellId) => {
    return spellId > 0
  }).length

  function isLocked(spell: SummonerSpell) {
    return summonerLevel !== null && (spell.summonerLevel ?? 0) > summonerLevel
  }

  function goToLobby() {
    void navigate({ to: '/connected/lobby' })
  }

  function handleChange(values: string[]) {
    const ids = values.map(Number)
    const next: [number, number] = [ids.includes(picked[0]) ? picked[0] : 0, ids.includes(picked[1]) ? picked[1] : 0]
    const added = ids.find((spellId) => {
      return !picked.includes(spellId)
    })
    const free = next.indexOf(0)

    if (added !== undefined && free !== -1) {
      next[free] = added
    }

    setPicked(next)
  }

  return (
    <QuickPlayScreen
      confirmDisabled={count < 2 || quickPlay.isPending}
      hasError={quickPlay.error !== null}
      title={t('lobby.quickPlay.selectSpells')}
      onConfirm={() => {
        if (picked[0] === slot?.spell1 && picked[1] === slot.spell2) {
          goToLobby()

          return
        }

        quickPlay.setSpells(option, picked, goToLobby)
      }}
    >
      <TileGroup
        aria-label={t('lobby.quickPlay.spells')}
        multiple
        style={styles.grid}
        value={picked
          .filter((spellId) => {
            return spellId > 0
          })
          .map(String)}
        onValueChange={handleChange}
      >
        {quickPlay.spells.map((spell) => {
          return (
            <Tile
              key={spell.id}
              disabled={isLocked(spell)}
              image={resolveSpellIcon(spell.id, quickPlay.spells)}
              infoLabel={t('lobby.quickPlay.aboutSpell', { name: spell.name })}
              label={spell.name}
              value={String(spell.id)}
              onInfoClick={() => {
                setInfo(spell)
                setIsInfoOpen(true)
              }}
            />
          )
        })}
      </TileGroup>

      <p aria-live="polite" {...props(text.heading2, styles.count)}>
        {t('lobby.quickPlay.spellsPicked', { count })}
      </p>

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
  count: {
    color: color.text,
    margin: 0,
  },
  // Figma: four 80px tiles to a row across the 364px body
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 80px)',
    justifyContent: 'space-between',
    rowGap: 16,
  },
})
