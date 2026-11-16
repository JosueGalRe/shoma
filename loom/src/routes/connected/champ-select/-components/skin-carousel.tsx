import { useRef, useState } from 'react'

import { Icon } from '@shoma/ui/icon'
import { IconButton } from '@shoma/ui/icon-button'
import { text } from '@shoma/ui/text'
import { Tile, TileGroup } from '@shoma/ui/tile'
import { color } from '@shoma/ui/tokens/color.stylex'
import { create, props } from '@stylexjs/stylex'
import { useTranslation } from 'react-i18next'

import { communityDragonGameDataUrl } from '@/core/http/ddragon'
import { isSkinOwned } from '@/core/lcu/parsers/skins'

import type { SkinCarouselProps } from './champ-select-screen-types'
import type { ChampionSkin } from '@/core/lcu/parsers/skins'

// Figma: 175 by 105 skins, 16 apart
const SKIN_WIDTH = 175
const SKIN_GAP = 16
// How far a swipe travels before it moves one skin
const SWIPE_PX = 40

// Figma "Carrousel": every skin of the champion, the one in view in the middle with its neighbors at the sides. The
// Arrows, a swipe or a tap on a neighbor bring the next one to the middle, and an owned one is picked on arrival. As in
// The client, one the player doesn't own can be looked at, greyed, while the pick stays on the last owned one
export function SkinCarousel({ label, onPick, skins, value }: SkinCarouselProps) {
  const { t } = useTranslation()
  const swipeStart = useRef<number | null>(null)
  const [viewedId, setViewedId] = useState<number>()
  const index = skins.findIndex(({ id }) => {
    return id === (viewedId ?? value)
  })
  const position = Math.max(index, 0)
  const viewed = skins[position]
  const previous = skins[position - 1]
  const next = skins[position + 1]

  function show(skin: ChampionSkin | undefined) {
    if (!skin) {
      return
    }

    setViewedId(skin.id)

    if (isSkinOwned(skin) && skin.id !== value) {
      onPick(skin.id)
    }
  }

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
          show(target)
        }}
      >
        <div {...props(styles.track, styles.offset(position * (SKIN_WIDTH + SKIN_GAP) + SKIN_WIDTH / 2))}>
          <TileGroup
            aria-label={label}
            style={styles.group}
            value={[String(value)]}
            // Tapping the picked skin again leaves no value; a skin not owned stays unpressed, only in view
            onValueChange={(values) => {
              show(
                skins.find(({ id }) => {
                  return String(id) === values[0]
                }),
              )
            }}
          >
            {skins.map((skin) => {
              return (
                <Tile
                  key={skin.id}
                  image={communityDragonGameDataUrl(skin.splashPath)}
                  label={skin.name}
                  size="large"
                  style={!isSkinOwned(skin) && styles.notOwned}
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
          show(previous)
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
          show(next)
        }}
      >
        <Icon name="arrow-right" />
      </IconButton>

      <p aria-live="polite" {...props(text.body3, styles.caption, viewed && !isSkinOwned(viewed) && styles.captionShown)}>
        {viewed && !isSkinOwned(viewed) ? t('champSelect.skinNotOwned', { name: viewed.name }) : null}
      </p>
    </div>
  )
}

const styles = create({
  // Over the row's middle, the caption's line under it apart
  arrow: {
    position: 'absolute',
    top: 'calc(50% - 12px)',
    transform: 'translateY(-50%)',
  },
  // Its line stays when empty, so nothing moves when a skin not owned comes into view
  caption: {
    color: color.textSecondary,
    margin: 0,
    marginBlockStart: 8,
    minHeight: '1lh',
    opacity: 0,
    paddingInline: 24,
    textAlign: 'center',
    transitionDuration: '150ms',
    transitionProperty: 'opacity',
  },
  captionShown: {
    opacity: 1,
  },
  group: {
    display: 'flex',
    gap: SKIN_GAP,
  },
  next: {
    right: 8,
  },
  notOwned: {
    filter: 'grayscale(1)',
    opacity: 0.6,
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
