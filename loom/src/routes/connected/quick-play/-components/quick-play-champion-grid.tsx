import { useState } from 'react'

import { Icon } from '@shoma/ui/icon'
import { IconButton } from '@shoma/ui/icon-button'
import { ScrollArea } from '@shoma/ui/scroll-area'
import { text } from '@shoma/ui/text'
import { TextField } from '@shoma/ui/text-field'
import { Tile, TileGroup } from '@shoma/ui/tile'
import { color } from '@shoma/ui/tokens/color.stylex'
import { create, props } from '@stylexjs/stylex'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'

import { communityDragonGameDataUrl } from '@/core/http/ddragon'
import {
  championMasteryDescriptor,
  createLcuQueryOptions,
  favoriteChampionsDescriptor,
  queueChampionsDescriptor,
} from '@/core/lcu/queries'
import { useSharedLCUTransport } from '@/core/relay/use-relay-state'
import { rankedSearch, rankName } from '@/lib/fuzzy-search-utils'

import { sortChampions } from './quick-play-screen-utils'
import { QuickPlaySortSheet } from './quick-play-sort-sheet'

import type { ChampionSort, QuickPlayChampionGridProps } from './quick-play-screen-types'

// Figma "Select Champion": a name search over the champions the player can take into the queue, and the client's
// Orders beside it. A search ranks by match, as the client's ignores the order
export function QuickPlayChampionGrid({ championId, onPick, queueId, summonerId }: QuickPlayChampionGridProps) {
  const { t } = useTranslation()
  const transport = useSharedLCUTransport()
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<ChampionSort>('name')
  const [isSortOpen, setIsSortOpen] = useState(false)
  const championsQuery = useQuery({
    ...createLcuQueryOptions(queueChampionsDescriptor(summonerId ?? 0, queueId ?? 0), transport),
    enabled: Boolean(transport && summonerId && queueId),
  })
  const mastery = useQuery(createLcuQueryOptions(championMasteryDescriptor, transport)).data
  const favorites = useQuery(createLcuQueryOptions(favoriteChampionsDescriptor, transport)).data
  const champions = sortChampions(championsQuery.data ?? [], sort, {
    favorites: favorites ?? new Set(),
    mastery: mastery ?? new Map(),
  })
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
      <div {...props(styles.searchRow)}>
        <TextField
          aria-label={t('lobby.quickPlay.search')}
          clearLabel={t('lobby.quickPlay.clearSearch')}
          placeholder={t('lobby.quickPlay.search')}
          enterKeyHint="search"
          style={styles.search}
          value={search}
          onValueChange={setSearch}
        />

        <IconButton
          aria-label={t('lobby.quickPlay.sortBy')}
          onClick={() => {
            setIsSortOpen(true)
          }}
        >
          <Icon name="sort" />
        </IconButton>
      </div>

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

      <QuickPlaySortSheet open={isSortOpen} sort={sort} onApply={setSort} onOpenChange={setIsSortOpen} />
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
    flexGrow: 1,
    minWidth: 0,
  },
  // Figma: the search and the sort button, 8 apart
  searchRow: {
    alignItems: 'center',
    display: 'flex',
    flexShrink: 0,
    gap: 8,
  },
})
