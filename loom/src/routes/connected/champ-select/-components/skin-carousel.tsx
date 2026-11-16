import { useRef } from 'react'

import { Icon } from '@shoma/ui/icon'
import { IconButton } from '@shoma/ui/icon-button'
import { Tile, TileGroup } from '@shoma/ui/tile'
import { create, props } from '@stylexjs/stylex'
import { useTranslation } from 'react-i18next'

import { communityDragonGameDataUrl } from '@/core/http/ddragon'

import type { SkinCarouselProps } from './champ-select-screen-types'

// Figma: 175 by 105 skins, 16 apart
const SKIN_WIDTH = 175
const SKIN_GAP = 16
// How far a swipe travels before it moves one skin
const SWIPE_PX = 40

// Figma "Carrousel": the picked skin in the middle with its neighbors at the sides. The arrows, a swipe or a tap on a
// Neighbor pick the next one, which slides to the middle
export function SkinCarousel({ label, onPick, skins, value }: SkinCarouselProps) {
  const { t } = useTranslation()
  const swipeStart = useRef<number | null>(null)
  const index = skins.findIndex(({ id }) => {
    return id === value
  })
  const position = Math.max(index, 0)
  const previous = skins[position - 1]
  const next = skins[position + 1]

  function readSwipe(distance: number) {
    if (distance > SWIPE_PX) {
      return previous
    }

    return distance < -SWIPE_PX ? next : undefined
  }

  // Nothing until the skins arrive, so the row opens on the picked one instead of sliding there
  if (skins.length === 0) {
    return null
  }

  return (
    <div {...props(styles.root)}>
      <div
        {...props(styles.viewport)}
        onPointerCancel={() => {
          swipeStart.current = null
        }}
        onPointerDown={(event) => {
          swipeStart.current = event.clientX
        }}
        onPointerUp={(event) => {
          const target = swipeStart.current === null ? undefined : readSwipe(event.clientX - swipeStart.current)

          swipeStart.current = null

          if (target) {
            onPick(target.id)
          }
        }}
      >
        <div {...props(styles.track, styles.offset(position * (SKIN_WIDTH + SKIN_GAP) + SKIN_WIDTH / 2))}>
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
        </div>
      </div>

      <IconButton
        aria-label={t('champSelect.previousSkin')}
        disabled={!previous}
        style={[styles.arrow, styles.previous]}
        variant="filled"
        onClick={() => {
          if (previous) {
            onPick(previous.id)
          }
        }}
      >
        <Icon name="arrow-left" />
      </IconButton>

      <IconButton
        aria-label={t('champSelect.nextSkin')}
        disabled={!next}
        style={[styles.arrow, styles.next]}
        variant="filled"
        onClick={() => {
          if (next) {
            onPick(next.id)
          }
        }}
      >
        <Icon name="arrow-right" />
      </IconButton>
    </div>
  )
}

const styles = create({
  arrow: {
    position: 'absolute',
    top: '50%',
    transform: 'translateY(-50%)',
  },
  group: {
    display: 'flex',
    gap: SKIN_GAP,
  },
  next: {
    right: 8,
  },
  // eslint-disable-next-line arrow-body-style -- StyleX only compiles dynamic styles written as (x) => ({ ... })
  offset: (pixels: number) => ({ transform: `translateX(${-pixels}px)` }),
  previous: {
    left: 8,
  },
  // Edge to edge across the panel's 24px sides
  root: {
    flexShrink: 0,
    marginInline: -24,
    position: 'relative',
  },
  // Starts at the middle; the offset slides the picked skin's center onto it
  track: {
    marginInlineStart: '50%',
    transitionDuration: { '@media (prefers-reduced-motion: reduce)': '0s', default: '250ms' },
    transitionProperty: 'transform',
    transitionTimingFunction: 'ease-out',
    width: 'max-content',
  },
  // Room for the picked tile's ring; vertical drags still scroll the panel
  viewport: {
    overflow: 'hidden',
    paddingBlock: 6,
    touchAction: 'pan-y',
  },
})
