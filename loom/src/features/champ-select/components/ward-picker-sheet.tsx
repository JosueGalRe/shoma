import { useTranslation } from 'react-i18next'

import { BottomSheet } from '@/components/ui/bottom-sheet'

import { lcuAssetUrl } from '../champ-select-utils'

import { wardPickerSheetStyles } from './ward-picker-sheet-styles'

import type { WardSkin } from '@/core/lcu/parsers/champ-select'

export interface WardPickerSheetProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (wardSkinId: number) => void
  selectedWardSkinId: number | null
  wardSkins: WardSkin[]
}

export function WardPickerSheet({ isOpen, onClose, onSelect, selectedWardSkinId, wardSkins }: WardPickerSheetProps) {
  const { t } = useTranslation()
  const styles = wardPickerSheetStyles()

  return (
    <BottomSheet
      dragHandleAriaLabel={t('common.dragBottomSheet')}
      isOpen={isOpen}
      onClose={onClose}
      title={t('champSelect.wardSkin')}
    >
      <div className={styles.grid()}>
        {wardSkins.map((wardSkin) => {
          const imageUrl = lcuAssetUrl(wardSkin.wardImagePath)
          const isSelected = selectedWardSkinId === wardSkin.id

          return (
            <button
              aria-pressed={isSelected}
              className={styles.card({ selected: isSelected })}
              key={wardSkin.id}
              onClick={() => {
                onSelect(wardSkin.id)
                onClose()
              }}
              type="button"
            >
              {imageUrl ? <img alt="" className={styles.image()} loading="lazy" src={imageUrl} /> : null}

              <span className={styles.name()}>{wardSkin.name ?? wardSkin.id}</span>
            </button>
          )
        })}
      </div>
    </BottomSheet>
  )
}
