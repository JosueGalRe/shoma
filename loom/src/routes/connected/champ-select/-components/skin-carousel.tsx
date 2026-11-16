import { useEffect, useRef } from 'react'

import { Tile, TileGroup } from '@shoma/ui/tile'
import { create, props } from '@stylexjs/stylex'

import { communityDragonGameDataUrl } from '@/core/http/ddragon'

import type { SkinCarouselProps } from './champ-select-screen-types'

// Figma "Carrousel": the skins in a row across the screen, the picked one centered. A tap picks a skin and brings it to
// The middle
export function SkinCarousel({ label, onPick, skins, value }: SkinCarouselProps) {
  const trackRef = useRef<HTMLDivElement>(null)
  const hasCentered = useRef(false)

  // External system sync: the scroll position follows the picked skin, at once the first time and smoothly after
  useEffect(() => {
    const tile = trackRef.current?.querySelector(`[data-skin="${value}"]`)

    if (!tile) {
      return
    }

    tile.scrollIntoView({ behavior: hasCentered.current ? 'smooth' : 'instant', block: 'nearest', inline: 'center' })
    hasCentered.current = true
  }, [skins, value])

  return (
    // A plain scroller: ScrollArea's viewport would take the scroll snapping and the edge-to-edge row
    <div ref={trackRef} {...props(styles.track)}>
      <TileGroup
        aria-label={label}
        style={styles.group}
        value={[String(value)]}
        onValueChange={(values) => {
          const picked = Number(values[0])

          if (picked > 0) {
            onPick(picked)
          }
        }}
      >
        {skins.map((skin) => {
          return (
            <div key={skin.id} data-skin={skin.id} {...props(styles.item)}>
              <Tile
                image={communityDragonGameDataUrl(skin.splashPath)}
                label={skin.name}
                size="large"
                value={String(skin.id)}
              />
            </div>
          )
        })}
      </TileGroup>
    </div>
  )
}

const styles = create({
  // Figma: 175 by 105 skins, 16 apart; the first and last can reach the middle
  group: {
    display: 'flex',
    gap: 16,
    paddingBlock: 6,
    paddingInline: 'calc(50% - 87.5px)',
    width: 'max-content',
  },
  item: {
    flexShrink: 0,
    scrollSnapAlign: 'center',
  },
  track: {
    flexShrink: 0,
    marginInline: -24,
    overflowX: 'auto',
    overscrollBehaviorX: 'contain',
    scrollSnapType: 'x mandatory',
    scrollbarWidth: 'none',
  },
})
