import { useState } from 'react'

import { Icon } from '@shoma/ui/icon'
import { IconButton } from '@shoma/ui/icon-button'
import { ScrollArea } from '@shoma/ui/scroll-area'
import { Select } from '@shoma/ui/select'
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
  recommendedChampionPositionsDescriptor,
} from '@/core/lcu/queries'
import { useSharedLCUTransport } from '@/core/relay/use-relay-state'
import { BRAVERY_CHAMPION_ID, BRAVERY_TILE_URL } from '@/features/champ-select/arena'
import { ROLE_ICONS } from '@/features/lobby/role-icons'
import { rankedSearch, rankName } from '@/lib/fuzzy-search-utils'

import { ChampionSortSheet } from './champion-sort-sheet'
import { sortChampions } from './picker-utils'

import type { ChampionGridProps, ChampionSort } from './picker-types'

const POSITIONS = ['TOP', 'JUNGLE', 'MIDDLE', 'BOTTOM', 'UTILITY'] as const
const ANY_POSITION = 'ANY'

// Figma "Select Champion": a name search over the champions, and the client's orders beside it. A search ranks by match,
// As the client's ignores the order. Not in the Figma: the client's position filter, by the lanes the LCU recommends
// Each champion for (/lol-perks/v1/recommended-champion-positions)
export function ChampionGrid({ bravery, disabledIds, isLoaded, onPick, options, value }: ChampionGridProps) {
  const { t } = useTranslation()
  const transport = useSharedLCUTransport()
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<ChampionSort>('name')
  const [isSortOpen, setIsSortOpen] = useState(false)
  const [position, setPosition] = useState<(typeof POSITIONS)[number] | null>(null)
  const mastery = useQuery(createLcuQueryOptions(championMasteryDescriptor, transport)).data
  const favorites = useQuery(createLcuQueryOptions(favoriteChampionsDescriptor, transport)).data
  const positions = useQuery(createLcuQueryOptions(recommendedChampionPositionsDescriptor, transport)).data
  const positionOptions = [
    { icon: ROLE_ICONS.FILL, label: t('lobby.quickPlay.allPositions'), value: ANY_POSITION },
    ...POSITIONS.map((lane) => {
      return { icon: ROLE_ICONS[lane], label: t(`lobby.roles.${lane.toLowerCase()}`), value: lane }
    }),
  ]
  const inPosition = position
    ? options.filter((option) => {
        return positions?.[option.id]?.includes(position) === true
      })
    : options
  const champions = sortChampions(inPosition, sort, {
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

        <Select
          iconOnly
          aria-label={t('lobby.quickPlay.position')}
          options={positionOptions}
          value={position ?? ANY_POSITION}
          onValueChange={(picked) => {
            setPosition(
              POSITIONS.find((lane) => {
                return lane === picked
              }) ?? null,
            )
          }}
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
        {isLoaded && shown.length === 0 ? <p {...props(text.body3, styles.empty)}>{t('lobby.quickPlay.noChampions')}</p> : null}

        <TileGroup
          aria-label={t('lobby.quickPlay.champion')}
          style={styles.grid}
          value={value > 0 || value === BRAVERY_CHAMPION_ID ? [String(value)] : []}
          onValueChange={(values) => {
            const picked = Number(values[0])

            // Tapping the picked champion again keeps it
            if (picked > 0 || picked === BRAVERY_CHAMPION_ID) {
              onPick(picked)
            }
          }}
        >
          {/* As the client's grid: Valentía first, once the search leaves more than one champion */}
          {bravery && shown.length > 1 ? (
            <Tile image={BRAVERY_TILE_URL} label={bravery} value={String(BRAVERY_CHAMPION_ID)} />
          ) : null}

          {shown.map((champion) => {
            return (
              <Tile
                key={champion.id}
                disabled={disabledIds?.has(champion.id)}
                image={communityDragonGameDataUrl(`/lol-game-data/assets/v1/champion-icons/${champion.id}.png`)}
                label={champion.name}
                value={String(champion.id)}
              />
            )
          })}
        </TileGroup>
      </ScrollArea>

      <ChampionSortSheet open={isSortOpen} sort={sort} onApply={setSort} onOpenChange={setIsSortOpen} />
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
  // Figma: the search and the sort button, 8 apart; the position filter goes between them
  searchRow: {
    alignItems: 'center',
    display: 'flex',
    flexShrink: 0,
    gap: 8,
  },
})
