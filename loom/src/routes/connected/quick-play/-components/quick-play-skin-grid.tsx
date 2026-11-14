import { ScrollArea } from '@shoma/ui/scroll-area'
import { Tile, TileGroup } from '@shoma/ui/tile'
import { create } from '@stylexjs/stylex'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'

import { communityDragonGameDataUrl } from '@/core/http/ddragon'
import { championSkinsDescriptor, createLcuQueryOptions } from '@/core/lcu/queries'
import { useSharedLCUTransport } from '@/core/relay/use-relay-state'

import type { QuickPlaySkinGridProps } from './quick-play-screen-types'

// Figma "Select Cosmetic": the picked champion's skins the player owns, two to a row
export function QuickPlaySkinGrid({ championId, onPick, skinId, summonerId }: QuickPlaySkinGridProps) {
  const { t } = useTranslation()
  const transport = useSharedLCUTransport()
  const skinsQuery = useQuery({
    ...createLcuQueryOptions(championSkinsDescriptor(summonerId ?? 0, championId), transport),
    enabled: Boolean(transport && summonerId && championId > 0),
  })

  return (
    <ScrollArea contentStyle={styles.content} style={styles.scroll}>
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
        {(skinsQuery.data ?? []).map((skin) => {
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
  )
}

const styles = create({
  content: {
    paddingBlock: 6,
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
})
