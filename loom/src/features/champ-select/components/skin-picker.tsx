import { useTranslation } from 'react-i18next'

import { type ChampionSkin } from '@/core/http/ddragon-client'
import { championSkinUrl } from '../utils'

interface SkinPickerProps {
  championKey: string | null
  onSelectSkin: (skinId: number) => void
  selectedSkinId: number | null
  skins: ChampionSkin[]
}

export function SkinPicker({
  championKey,
  onSelectSkin,
  selectedSkinId,
  skins,
}: SkinPickerProps) {
  const { t } = useTranslation()

  return (
    <div className="space-y-2">
      <div className="font-display text-sm font-medium uppercase tracking-[0.18em] text-primary">{t('champSelect.skins')}</div>
      <div className="grid grid-cols-2 gap-2">
        {skins.map((skin) => {
          const skinNumber = Number(skin.num)
          const isSelectedSkin = selectedSkinId === skinNumber

          return (
            <button
              className={`overflow-hidden rounded-md border bg-secondary/60 text-left transition-all hover:border-primary hover:shadow-[0_0_20px_var(--shoma-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${isSelectedSkin ? 'border-primary shadow-[0_0_20px_var(--shoma-primary)]' : 'border-border'}`}
              key={skin.id}
              onClick={() => onSelectSkin(skinNumber)}
              type="button"
            >
              <img
                alt={skin.name}
                className="h-20 w-full object-cover"
                loading="lazy"
                src={championSkinUrl(championKey, skinNumber) ?? undefined}
              />
              <div className="p-2 text-xs text-muted">{skin.name}</div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
