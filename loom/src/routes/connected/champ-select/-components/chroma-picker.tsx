import { useState } from 'react'

import { FadeImage } from '@shoma/ui/fade-image'
import { text } from '@shoma/ui/text'
import { color } from '@shoma/ui/tokens/color.stylex'
import { create, props } from '@stylexjs/stylex'
import { useTranslation } from 'react-i18next'

import { communityDragonGameDataUrl } from '@/core/http/ddragon'
import { isSkinOwned } from '@/core/lcu/parsers/skins'

import type { ChromaPickerProps } from './champ-select-screen-types'

interface ChromaOption {
  colors: string[]
  id: number
  image: string
  isOwned: boolean
  name: string
}

function readSwatch(colors: string[]): string | undefined {
  const [first, second = first] = colors

  return first ? `linear-gradient(135deg, ${first} 50%, ${second} 50%)` : undefined
}

// The client's chroma flyout, under the carousel: a swatch per chroma of the skin in the middle after the skin itself,
// The owned ones first, over the model of the one in view. An owned one is picked on tap; one the player doesn't own
// Only shows
export function ChromaPicker({ onPick, skin, value }: ChromaPickerProps) {
  const { t } = useTranslation()
  const [viewedId, setViewedId] = useState<number>()
  const isOwned = isSkinOwned(skin)
  const chromas = skin.chromas.toSorted((left, right) => {
    return Number(right.ownership.owned) - Number(left.ownership.owned) || left.id - right.id
  })
  const options: ChromaOption[] = [
    { colors: [], id: skin.id, image: skin.chromaPath, isOwned, name: skin.name },
    ...chromas.map((chroma) => {
      return {
        colors: chroma.colors,
        id: chroma.id,
        image: chroma.chromaPath,
        isOwned: isOwned && chroma.ownership.owned,
        name: chroma.name,
      }
    }),
  ]
  const viewed =
    options.find(({ id }) => {
      return id === (viewedId ?? value)
    }) ?? options[0]

  function renderName() {
    // The skin's own option needs no line: the carousel names it
    if (!viewed || viewed.id === skin.id) {
      return null
    }

    return viewed.isOwned ? viewed.name : t('champSelect.skinNotOwned', { name: viewed.name })
  }

  return (
    <div {...props(styles.root)}>
      <div aria-label={t('champSelect.chromas')} role="group" {...props(styles.swatches)}>
        {options.map((option) => {
          const swatch = readSwatch(option.colors)

          return (
            <button
              key={option.id}
              aria-label={option.name}
              aria-pressed={option.id === value}
              type="button"
              {...props(
                styles.swatch,
                swatch !== undefined && styles.colors(swatch),
                option.id === viewed?.id && styles.viewed,
                option.id === value && styles.picked,
                !option.isOwned && styles.notOwned,
              )}
              onClick={() => {
                setViewedId(option.id)

                if (option.isOwned && option.id !== value) {
                  onPick(option.id)
                }
              }}
            >
              {option.id === skin.id && skin.tilePath ? (
                <FadeImage src={communityDragonGameDataUrl(skin.tilePath)} style={styles.tile} />
              ) : null}
            </button>
          )
        })}
      </div>

      <p {...props(text.body3, styles.name)}>{renderName()}</p>

      {viewed?.image ? (
        <FadeImage
          key={viewed.id}
          src={communityDragonGameDataUrl(viewed.image)}
          style={[styles.model, !viewed.isOwned && styles.notOwned]}
        />
      ) : null}
    </div>
  )
}

const styles = create({
  // eslint-disable-next-line arrow-body-style -- StyleX only compiles dynamic styles written as (x) => ({ ... })
  colors: (background: string) => ({ backgroundImage: background }),
  // The render fills what the panel has left, never past its own size
  model: {
    flexGrow: 1,
    maxHeight: 303,
    maxWidth: '100%',
    minHeight: 0,
    objectFit: 'contain',
  },
  // Its line stays when empty, so nothing moves under it
  name: {
    color: color.textSecondary,
    margin: 0,
    minHeight: '1lh',
    textAlign: 'center',
  },
  notOwned: {
    filter: 'grayscale(1)',
    opacity: 0.6,
  },
  // The Tile's selected ring: a gap in the page background, then the accent
  picked: {
    boxShadow: `0 0 0 2px ${color.background}, 0 0 0 4px ${color.accent}`,
  },
  root: {
    alignItems: 'center',
    display: 'flex',
    flexDirection: 'column',
    flexGrow: 1,
    gap: 8,
    minHeight: 0,
    paddingInline: 24,
  },
  swatch: {
    WebkitTapHighlightColor: 'transparent',
    backgroundColor: color.surface,
    borderColor: color.tileBorder,
    borderRadius: '50%',
    borderStyle: 'solid',
    borderWidth: 1,
    boxSizing: 'border-box',
    cursor: 'pointer',
    flexShrink: 0,
    height: 32,
    outlineColor: color.focusRing,
    outlineOffset: 4,
    outlineStyle: { ':focus-visible': 'solid', default: 'none' },
    outlineWidth: 2,
    overflow: 'hidden',
    padding: 0,
    touchAction: 'manipulation',
    transitionDuration: '150ms',
    transitionProperty: 'box-shadow, opacity, filter',
    width: 32,
  },
  swatches: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'center',
    padding: 4,
  },
  tile: {
    display: 'block',
    height: '100%',
    objectFit: 'cover',
    width: '100%',
  },
  viewed: {
    borderColor: color.text,
  },
})
