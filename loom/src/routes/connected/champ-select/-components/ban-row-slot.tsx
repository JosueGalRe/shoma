import { FadeImage } from '@shoma/ui/fade-image'
import { Icon } from '@shoma/ui/icon'
import { color } from '@shoma/ui/tokens/color.stylex'
import { create, props } from '@stylexjs/stylex'
import { useTranslation } from 'react-i18next'

import { communityDragonGameDataUrl } from '@/core/http/ddragon'

import type { BanRowSlotProps } from './champ-select-screen-types'

// A slot of the ban row: the banned champion's art, or the ban mark while the ban is still to come or was none. Its edge
// Takes the team's color, as the team strip's circles
export function BanRowSlot({ championId, isAlly, name }: BanRowSlotProps) {
  const { t } = useTranslation()
  const team = isAlly ? styles.ally : styles.enemy

  if (!championId || championId <= 0) {
    return (
      <div aria-label={t('champSelect.noBan')} role="img" {...props(styles.frame, team, styles.empty)}>
        <Icon name="block" size={16} />
      </div>
    )
  }

  return (
    <div aria-label={name} role="img" {...props(styles.frame, team)}>
      <FadeImage
        src={communityDragonGameDataUrl(`/lol-game-data/assets/v1/champion-icons/${championId}.png`)}
        style={styles.image}
      />
    </div>
  )
}

const styles = create({
  ally: {
    borderColor: color.info,
  },
  empty: {
    alignItems: 'center',
    color: color.textSecondary,
    display: 'flex',
    justifyContent: 'center',
  },
  enemy: {
    borderColor: color.tileBorder,
  },
  // 32px, shrinking with the row on narrow phones. A width rather than a flex basis, so an empty slot sizes the team as
  // A filled one does and the row keeps its size while the bans come in
  frame: {
    aspectRatio: '1',
    borderStyle: 'solid',
    borderWidth: 1,
    boxSizing: 'border-box',
    flexShrink: 1,
    minWidth: 0,
    overflow: 'hidden',
    width: 32,
  },
  image: {
    display: 'block',
    height: '100%',
    objectFit: 'cover',
    width: '100%',
  },
})
