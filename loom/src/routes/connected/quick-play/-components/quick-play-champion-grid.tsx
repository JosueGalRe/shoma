import { useState } from 'react'

import { ScrollArea } from '@shoma/ui/scroll-area'
import { text } from '@shoma/ui/text'
import { TextField } from '@shoma/ui/text-field'
import { Tile, TileGroup } from '@shoma/ui/tile'
import { color } from '@shoma/ui/tokens/color.stylex'
import { create, props } from '@stylexjs/stylex'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'

import { communityDragonGameDataUrl } from '@/core/http/ddragon'
import { createLcuQueryOptions, queueChampionsDescriptor } from '@/core/lcu/queries'
import { useSharedLCUTransport } from '@/core/relay/use-relay-state'
import { rankedSearch, rankName } from '@/lib/fuzzy-search-utils'

import type { QuickPlayChampionGridProps } from './quick-play-screen-types'

// Figma "Select Champion": a name search over the champions the player can take into the queue
export function QuickPlayChampionGrid({ championId, onPick, queueId, summonerId }: QuickPlayChampionGridProps) {
  const { t } = useTranslation()
  const transport = useSharedLCUTransport()
  const [search, setSearch] = useState('')
  const championsQuery = useQuery({
    ...createLcuQueryOptions(queueChampionsDescriptor(summonerId ?? 0, queueId ?? 0), transport),
    enabled: Boolean(transport && summonerId && queueId),
  })
  const champions = championsQuery.data ?? []
  const shown = search.trim()
    ? rankedSearch({
        items: champions,
        limit: champions.length,
        query: search,
        rankItem: (query, champion) => {
          return rankName(query, champion.name)
        },
      })
    : champions

  return (
    <>
      <TextField
        aria-label={t('lobby.quickPlay.search')}
        clearLabel={t('lobby.quickPlay.clearSearch')}
        placeholder={t('lobby.quickPlay.search')}
        enterKeyHint="search"
        style={styles.search}
        value={search}
        onValueChange={setSearch}
      />

      <ScrollArea contentStyle={styles.content} style={styles.scroll}>
        {championsQuery.isSuccess && shown.length === 0 ? (
          <p {...props(text.body3, styles.empty)}>{t('lobby.quickPlay.noChampions')}</p>
        ) : null}

        <TileGroup
          aria-label={t('lobby.quickPlay.champion')}
          style={styles.grid}
          value={championId > 0 ? [String(championId)] : []}
          onValueChange={(values) => {
            const picked = Number(values[0])

            // Tapping the picked champion again keeps it
            if (picked > 0) {
              onPick(picked)
            }
          }}
        >
          {shown.map((champion) => {
            return (
              <Tile
                key={champion.id}
                image={communityDragonGameDataUrl(`/lol-game-data/assets/v1/champion-icons/${champion.id}.png`)}
                label={champion.name}
                value={String(champion.id)}
              />
            )
          })}
        </TileGroup>
      </ScrollArea>
    </>
  )
}

const styles = create({
  // Room for the picked tile's ring, which reaches past the tile
  content: {
    paddingBlock: 6,
  },
  empty: {
    color: color.textSecondary,
    margin: 0,
    textAlign: 'center',
  },
  // Figma: 80px tiles three to a row, 16 apart, centered
  grid: {
    display: 'grid',
    gap: 16,
    gridTemplateColumns: 'repeat(3, 80px)',
    justifyContent: 'center',
  },
  scroll: {
    flexGrow: 1,
    marginBlockEnd: -16,
    marginInline: -24,
  },
  search: {
    flexShrink: 0,
  },
})
