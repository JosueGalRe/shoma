import { FadeImage } from '@shoma/ui/fade-image'
import { Icon } from '@shoma/ui/icon'
import { text } from '@shoma/ui/text'
import { color } from '@shoma/ui/tokens/color.stylex'
import { create, props } from '@stylexjs/stylex'
import { useTranslation } from 'react-i18next'

import { communityDragonGameDataUrl } from '@/core/http/ddragon'

import type { BannedChampionProps } from './champ-select-screen-types'

// Figma "Champion card" in the bans: the champion's art with the ban mark on its bottom edge and its name below. A ban
// Still to come, or none, is the empty frame with the mark in the middle
export function BannedChampion({ championId, name }: BannedChampionProps) {
  const { t } = useTranslation()

  if (!championId || championId <= 0) {
    return (
      <div aria-label={t('champSelect.noBan')} role="img" {...props(styles.frame, styles.empty)}>
        <Icon name="block" />
      </div>
    )
  }

  return (
    <figure {...props(styles.card)}>
      <div {...props(styles.frame)}>
        <FadeImage
          src={communityDragonGameDataUrl(`/lol-game-data/assets/v1/champion-icons/${championId}.png`)}
          style={styles.image}
        />

        <span aria-hidden {...props(styles.mark)}>
          <Icon name="block" size={20} />
        </span>
      </div>

      <figcaption {...props(text.body3, styles.name)}>{name}</figcaption>
    </figure>
  )
}

const styles = create({
  card: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
    margin: 0,
    width: 80,
  },
  empty: {
    alignItems: 'center',
    color: color.text,
    display: 'flex',
    justifyContent: 'center',
  },
  // The Figma tile's 1px shimmer-300 edge
  frame: {
    borderColor: color.tileBorder,
    borderStyle: 'solid',
    borderWidth: 1,
    boxSizing: 'border-box',
    height: 80,
    position: 'relative',
    width: 80,
  },
  image: {
    display: 'block',
    height: '100%',
    objectFit: 'cover',
    width: '100%',
  },
  // The ban mark: a navy disc astride the bottom edge
  mark: {
    alignItems: 'center',
    backgroundColor: color.background,
    borderRadius: '50%',
    bottom: -12,
    color: color.text,
    display: 'flex',
    height: 24,
    justifyContent: 'center',
    left: '50%',
    position: 'absolute',
    transform: 'translateX(-50%)',
    width: 24,
  },
  // A long name may reach into the gap between cards rather than break inside a word
  name: {
    color: color.text,
    marginInline: -8,
    overflowWrap: 'break-word',
    textAlign: 'center',
  },
})
