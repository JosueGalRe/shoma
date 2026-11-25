import { useState } from 'react'

import { ScrollArea } from '@shoma/ui/scroll-area'
import { text } from '@shoma/ui/text'
import { Tile, TileGroup } from '@shoma/ui/tile'
import { color } from '@shoma/ui/tokens/color.stylex'
import { useToast } from '@shoma/ui/use-toast'
import { create, props } from '@stylexjs/stylex'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'

import { createLcuQueryOptions, currentSummonerDescriptor } from '@/core/lcu/queries'
import { useSharedLCUTransport } from '@/core/relay/use-relay-state'
import { SpellId } from '@/core/types/branded'
import { InfoSheet } from '@/features/champ-select/components/info-sheet'
import { resolveSpellIcon } from '@/lib/asset-resolver'

import { ChampSelectAction } from './champ-select-action'
import { toggleSpell } from './champ-select-screen-utils'

import type { ChampSelectPanelProps } from './champ-select-screen-types'
import type { SummonerSpell } from '@/core/lcu/queries/summoner'

// Figma "Spells Selection": the mode's summoner spells, two picked, D then F. Spells above the player's level are locked,
// As the client locks them. CONFIRM takes both into the game
export function SpellsPanel({ actionSlot, champSelect }: ChampSelectPanelProps) {
  const { t } = useTranslation()
  const transport = useSharedLCUTransport()
  const toast = useToast()
  const level = useQuery(createLcuQueryOptions(currentSummonerDescriptor, transport)).data?.summonerLevel
  const [draft, setDraft] = useState<[number, number]>()
  const [isSending, setIsSending] = useState(false)
  // Kept after closing, so the sheet keeps its text while it slides away
  const [info, setInfo] = useState<SummonerSpell>()
  const [isInfoOpen, setIsInfoOpen] = useState(false)
  const spells = champSelect.summonerSpells.filter((spell) => {
    return spell.gameModes?.includes(champSelect.gameMode)
  })
  const { spell1Id, spell2Id } = champSelect.selection
  const saved: [number, number] = [spell1Id ?? 0, spell2Id ?? 0]
  const picked = draft ?? saved
  const pickedValues = picked.flatMap((id) => {
    return id > 0 ? [String(id)] : []
  })

  function isLocked(spell: SummonerSpell) {
    return typeof level === 'number' && (spell.summonerLevel ?? 0) > level
  }

  return (
    <div {...props(styles.root)}>
      <h2 {...props(text.heading2, styles.subtitle)}>{t('champSelect.selectSpells')}</h2>

      <ScrollArea contentStyle={styles.content} style={styles.scroll}>
        <TileGroup
          multiple
          aria-label={t('champSelect.spells')}
          style={styles.grid}
          value={pickedValues}
          onValueChange={(values) => {
            const toggled =
              values.find((value) => {
                return !pickedValues.includes(value)
              }) ??
              pickedValues.find((value) => {
                return !values.includes(value)
              })

            if (toggled) {
              setDraft(toggleSpell(picked, Number(toggled)))
            }
          }}
        >
          {spells.map((spell) => {
            return (
              <Tile
                key={spell.id}
                disabled={isLocked(spell)}
                image={resolveSpellIcon(spell.id, spells)}
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
      </ScrollArea>

      <p {...props(text.body1, styles.count)}>{t('champSelect.spellsPicked', { count: pickedValues.length })}</p>

      <InfoSheet
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

      <ChampSelectAction
        disabled={isSending || picked.includes(0) || (picked[0] === saved[0] && picked[1] === saved[1])}
        label={t('createLobby.confirm')}
        slot={actionSlot}
        onClick={() => {
          setIsSending(true)

          void champSelect.changeSelection({ spell1Id: SpellId(picked[0]), spell2Id: SpellId(picked[1]) }).then((ok) => {
            setIsSending(false)

            if (ok) {
              setDraft(undefined)

              return
            }

            toast.add({ title: t('errors.generic'), type: 'error' })
          })
        }}
      />
    </div>
  )
}

const styles = create({
  // Room for the picked tiles' ring and the info badges, which reach past them
  content: {
    padding: 12,
  },
  count: {
    color: color.text,
    flexShrink: 0,
    margin: 0,
  },
  // Figma: 80px tiles four to a row across the body, 16 between rows
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 80px)',
    justifyContent: 'space-between',
    rowGap: 16,
  },
  root: {
    display: 'flex',
    flexDirection: 'column',
    flexGrow: 1,
    gap: 32,
    minHeight: 0,
    paddingBlock: 16,
    paddingInline: 24,
  },
  scroll: {
    flexShrink: 1,
    margin: -12,
    minHeight: 0,
  },
  subtitle: {
    color: color.text,
    flexShrink: 0,
    margin: 0,
  },
})
