import { FadeImage } from '@shoma/ui/fade-image'
import { Icon } from '@shoma/ui/icon'
import { color } from '@shoma/ui/tokens/color.stylex'
import { create, props } from '@stylexjs/stylex'
import { useTranslation } from 'react-i18next'

import { communityDragonGameDataUrl } from '@/core/http/ddragon'

import type { BannedChampionProps } from './champ-select-screen-types'

// Figma "Champion card" in the bans: the champion's art with the ban mark on its bottom edge, or the empty frame with the
// Mark in the middle when the ban was none. Five to a row, so the name goes to the label instead of under the card
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
    <div aria-label={name} role="img" {...props(styles.frame)}>
      <FadeImage
        src={communityDragonGameDataUrl(`/lol-game-data/assets/v1/champion-icons/${championId}.png`)}
        style={styles.image}
      />

      <span aria-hidden {...props(styles.mark)}>
        <Icon name="block" size={16} />
      </span>
    </div>
  )
}

const styles = create({
  empty: {
    alignItems: 'center',
    color: color.text,
    display: 'flex',
    justifyContent: 'center',
  },
  // The Figma tile's 1px shimmer-300 edge, 64px or less on narrow phones
  frame: {
    aspectRatio: '1',
    borderColor: color.tileBorder,
    borderStyle: 'solid',
    borderWidth: 1,
    boxSizing: 'border-box',
    flexBasis: 0,
    flexGrow: 1,
    maxWidth: 64,
    minWidth: 0,
    position: 'relative',
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
    bottom: -10,
    color: color.text,
    display: 'flex',
    height: 20,
    justifyContent: 'center',
    left: '50%',
    position: 'absolute',
    transform: 'translateX(-50%)',
    width: 20,
  },
})
