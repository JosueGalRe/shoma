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
import { isSkinOwned } from '@/core/lcu/parsers/skins'
import { championSkinsDescriptor, createLcuQueryOptions } from '@/core/lcu/queries'
import { useSharedLCUTransport } from '@/core/relay/use-relay-state'
import { rankedSearch, rankName } from '@/lib/fuzzy-search-utils'

import type { QuickPlaySkinGridProps } from './quick-play-screen-types'

// Figma "Select Cosmetic": a name search over the picked champion's skins the player owns, two to a row
export function QuickPlaySkinGrid({ championId, onPick, skinId, summonerId }: QuickPlaySkinGridProps) {
  const { t } = useTranslation()
  const transport = useSharedLCUTransport()
  const [search, setSearch] = useState('')
  const skinsQuery = useQuery({
    ...createLcuQueryOptions(championSkinsDescriptor(summonerId ?? 0, championId), transport),
    enabled: Boolean(transport && summonerId && championId > 0),
  })
  const skins = (skinsQuery.data ?? []).filter(isSkinOwned)
  const shown = search.trim()
    ? rankedSearch({
        items: skins,
        limit: skins.length,
        query: search,
        rankItem: (query, skin) => {
          return rankName(query, skin.name)
        },
      })
    : skins

  return (
    <>
      <TextField
        aria-label={t('lobby.quickPlay.searchSkins')}
        clearLabel={t('lobby.quickPlay.clearSearch')}
        placeholder={t('lobby.quickPlay.searchSkins')}
        enterKeyHint="search"
        style={styles.search}
        value={search}
        onValueChange={setSearch}
      />

      <ScrollArea contentStyle={styles.content} style={styles.scroll}>
        {skinsQuery.isSuccess && shown.length === 0 ? (
          <p {...props(text.body3, styles.empty)}>{t('lobby.quickPlay.noSkins')}</p>
        ) : null}

        <TileGroup
          aria-label={t('lobby.quickPlay.cosmeticsTab')}
          style={styles.grid}
          value={[String(skinId)]}
          onValueChange={(values) => {
            const picked = Number(values[0])

            if (picked > 0) {
              onPick(picked)
            }
          }}
        >
          {shown.map((skin) => {
            return (
              <Tile
                key={skin.id}
                image={communityDragonGameDataUrl(skin.splashPath)}
                label={skin.name}
                size="large"
                value={String(skin.id)}
              />
            )
          })}
        </TileGroup>
      </ScrollArea>
    </>
  )
}

const styles = create({
  content: {
    paddingBlock: 6,
  },
  empty: {
    color: color.textSecondary,
    margin: 0,
    textAlign: 'center',
  },
  // Figma: 175 by 105, 14 apart
  grid: {
    display: 'grid',
    gap: 14,
    gridTemplateColumns: 'repeat(2, 175px)',
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
