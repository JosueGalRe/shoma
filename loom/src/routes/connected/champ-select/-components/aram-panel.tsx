import { useState } from 'react'

import { Icon } from '@shoma/ui/icon'
import { ScrollArea } from '@shoma/ui/scroll-area'
import { Tab, Tabs, TabsList, TabsPanel } from '@shoma/ui/tabs'
import { Tile, TileGroup } from '@shoma/ui/tile'
import { color } from '@shoma/ui/tokens/color.stylex'
import { useToast } from '@shoma/ui/use-toast'
import { create, props } from '@stylexjs/stylex'
import { useTranslation } from 'react-i18next'

import { communityDragonGameDataUrl } from '@/core/http/ddragon'
import { ChampionId } from '@/core/types/branded'
import { resolveChampionLoading } from '@/lib/asset-resolver'

import { ChampSelectAction } from './champ-select-action'
import { SkinPanel } from './skin-panel'

import type { ChampSelectPanelProps } from './champ-select-screen-types'
import type { ChampionSummary } from '@/core/http/ddragon'

type AramTab = 'champion' | 'cosmetics'

function readChampionName(champions: readonly ChampionSummary[], championId: number): string {
  return (
    champions.find(({ id }) => {
      return id === championId
    })?.name ?? ''
  )
}

// Shortcut: two empty cards until the deal arrives, as Figma's frame draws them; three with the blessing would grow it
const PLACEHOLDER_CARDS = [0, 1]

// Figma ARAM "Champion Selection" (336:17012): the player's cards, one picked with CONFIRM, then the team's bench under
// Them. Once picked, the other cards go grey and a tap on one swaps to it, as the client lets until the picks end; the
// Bench opens in finalization. Cosmetics waits for the champion. Figma's search isn't drawn: there's nothing to search
export function AramPanel({ actionSlot, champSelect }: ChampSelectPanelProps) {
  const { t } = useTranslation()
  const toast = useToast()
  const [tab, setTab] = useState<AramTab>('champion')
  const [draft, setDraft] = useState<number>()
  const [isSending, setIsSending] = useState(false)
  const { aram, champions } = champSelect
  const local = champSelect.team.find((member) => {
    return member.cellId === champSelect.localPlayerCellId
  })
  const championId = local?.championId ?? 0
  const hasPicked = championId > 0
  const isPicking = champSelect.session?.timer?.phase === 'BAN_PICK'
  const cards = new Set<number>(aram.cards)
  // The player's own cards stay in their row
  const bench = aram.bench.filter((benchId) => {
    return !cards.has(benchId)
  })
  const cardValue = hasPicked ? championId : (draft ?? 0)

  async function send(action: () => Promise<boolean>) {
    setIsSending(true)

    const ok = await action()

    setIsSending(false)

    if (!ok) {
      toast.add({ title: t('errors.generic'), type: 'error' })
    }
  }

  function swapTo(benchId: number) {
    if (benchId !== championId && aram.bench.includes(ChampionId(benchId))) {
      void send(() => {
        return aram.swapBench(ChampionId(benchId))
      })
    }
  }

  return (
    <Tabs
      style={styles.root}
      value={hasPicked ? tab : 'champion'}
      onValueChange={(value: AramTab) => {
        setTab(value)
      }}
    >
      <TabsList style={styles.list}>
        <Tab value="champion">{t('champSelect.champion')}</Tab>

        <Tab disabled={!hasPicked} value="cosmetics">
          {t('champSelect.cosmetics')}
        </Tab>
      </TabsList>

      <TabsPanel style={styles.panel} value="champion">
        <ScrollArea contentStyle={styles.content} style={styles.scroll}>
          {aram.cards.length === 0 ? (
            <div {...props(styles.cards)}>
              {PLACEHOLDER_CARDS.map((index) => {
                return (
                  <span key={index} aria-hidden {...props(styles.card, styles.placeholder)}>
                    <Icon name="champion" />
                  </span>
                )
              })}
            </div>
          ) : (
            <TileGroup
              aria-label={t('champSelect.cards')}
              style={styles.cards}
              value={cardValue > 0 ? [String(cardValue)] : []}
              onValueChange={(values) => {
                const picked = Number(values[0])

                if (picked <= 0) {
                  return
                }

                if (hasPicked) {
                  swapTo(picked)

                  return
                }

                setDraft(picked)
              }}
            >
              {aram.cards.map((cardId) => {
                return (
                  <Tile
                    key={cardId}
                    disabled={isSending}
                    image={resolveChampionLoading(cardId, champions) ?? ''}
                    label={readChampionName(champions, cardId)}
                    style={[styles.card, hasPicked && cardId !== championId && styles.unpicked]}
                    value={String(cardId)}
                  />
                )
              })}
            </TileGroup>
          )}

          {bench.length > 0 ? (
            <TileGroup
              aria-label={t('champSelect.bench')}
              style={styles.bench}
              value={[]}
              onValueChange={(values) => {
                swapTo(Number(values[0]))
              }}
            >
              {bench.map((benchId) => {
                return (
                  <Tile
                    key={benchId}
                    disabled={!hasPicked || isPicking || isSending}
                    image={communityDragonGameDataUrl(`/lol-game-data/assets/v1/champion-icons/${benchId}.png`)}
                    label={readChampionName(champions, benchId)}
                    style={styles.benchTile}
                    value={String(benchId)}
                  />
                )
              })}
            </TileGroup>
          ) : null}
        </ScrollArea>
      </TabsPanel>

      <TabsPanel style={styles.panel} value="cosmetics">
        <SkinPanel champSelect={champSelect} />
      </TabsPanel>

      {hasPicked ? null : (
        <ChampSelectAction
          disabled={isSending || draft === undefined || !cards.has(draft)}
          label={t('createLobby.confirm')}
          slot={actionSlot}
          onClick={() => {
            if (draft !== undefined) {
              void send(() => {
                return aram.pickCard(ChampionId(draft))
              })
            }
          }}
        />
      )}
    </Tabs>
  )
}

const styles = create({
  // Figma "More champions": 56px tiles, five to a row, 16 apart
  bench: {
    display: 'grid',
    gap: 16,
    gridTemplateColumns: 'repeat(5, 56px)',
    justifyContent: 'center',
  },
  benchTile: {
    height: 56,
    width: 56,
  },
  // Figma: the cards' 101x181 "Champions", 16 apart and centered
  card: {
    height: 181,
    width: 101,
  },
  cards: {
    display: 'flex',
    gap: 16,
    justifyContent: 'center',
  },
  // Figma "Body": 24 at the sides, 32 between the cards and the bench; room for the picked card's ring
  content: {
    display: 'flex',
    flexDirection: 'column',
    gap: 32,
    paddingBlock: 6,
    paddingInline: 24,
  },
  list: {
    alignSelf: 'center',
  },
  panel: {
    display: 'flex',
    flexDirection: 'column',
    flexGrow: 1,
    minHeight: 0,
  },
  // The card frame before the deal: the tile's edge and the champion mark
  placeholder: {
    alignItems: 'center',
    borderColor: color.tileBorder,
    borderStyle: 'solid',
    borderWidth: 1,
    boxSizing: 'border-box',
    color: color.text,
    display: 'flex',
    justifyContent: 'center',
  },
  // Figma "Body": the tabs 16 under the timer and 32 over the cards
  root: {
    flexGrow: 1,
    gap: 26,
    minHeight: 0,
    paddingBlockStart: 16,
  },
  scroll: {
    flexGrow: 1,
  },
  // Figma: the cards not picked lose their color
  unpicked: {
    filter: 'grayscale(1)',
  },
})
