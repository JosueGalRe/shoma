import { useState } from 'react'

import { text } from '@shoma/ui/text'
import { Tile, TileGroup } from '@shoma/ui/tile'
import { color } from '@shoma/ui/tokens/color.stylex'
import { create, props } from '@stylexjs/stylex'
import { useNavigate } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'

import { useQuickPlaySlots } from '@/features/lobby/hooks/use-quick-play-slots'
import { resolveSpellIcon } from '@/lib/asset-resolver'

import { QuickPlayScreen } from './quick-play-screen'

import type { QuickPlayPickerProps } from './quick-play-screen-types'

// Figma "Spells Selection": two of Swift Play's summoner spells. Each keeps its key (D or F): dropping one frees its
// Place for the next pick, and a third waits until one is dropped
export function QuickPlaySpellScreen({ option }: QuickPlayPickerProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const quickPlay = useQuickPlaySlots()
  const slot = quickPlay.slots[option]
  const [picked, setPicked] = useState<[number, number]>([slot?.spell1 ?? 0, slot?.spell2 ?? 0])
  const count = picked.filter((spellId) => {
    return spellId > 0
  }).length

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
              image={resolveSpellIcon(spell.id, quickPlay.spells)}
              label={spell.name}
              value={String(spell.id)}
            />
          )
        })}
      </TileGroup>

      <p aria-live="polite" {...props(text.heading2, styles.count)}>
        {t('lobby.quickPlay.spellsPicked', { count })}
      </p>
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
