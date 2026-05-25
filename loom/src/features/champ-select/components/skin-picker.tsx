import { useTranslation } from 'react-i18next'

import { championSkinUrl } from '../champ-select-utils'

import { skinPickerStyles } from './skin-picker-styles'

import type { SkinPickerProps } from './skin-picker-types'

export function SkinPicker({ championKey, onSelectSkin, selectedSkinId, skins }: SkinPickerProps) {
  const { t } = useTranslation()
  const styles = skinPickerStyles()

  return (
    <div className={styles.root()}>
      <div className={styles.title()}>{t('champSelect.skins')}</div>

      <div className={styles.grid()}>
        {skins.map((skin) => {
          const skinNumber = Number(skin.num)
          const isSelectedSkin = selectedSkinId === skinNumber

          return (
            <button
              className={styles.card({ selected: isSelectedSkin })}
              key={skin.id}
              onClick={() => {
                return onSelectSkin(skinNumber)
              }}
              type='button'
            >
              <img
                alt={skin.name}
                className={styles.image()}
                loading='lazy'
                src={championSkinUrl(championKey, skinNumber) ?? undefined}
              />

              <div className={styles.label()}>{skin.name}</div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
