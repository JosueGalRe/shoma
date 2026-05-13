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
      <div className="font-display text-sm font-medium uppercase tracking-[0.18em] text-lol-gold">{t('champSelect.skins')}</div>
      <div className="grid grid-cols-2 gap-2">
        {skins.map((skin) => {
          const skinNumber = Number(skin.num)
          const isSelectedSkin = selectedSkinId === skinNumber

          return (
            <button
              className={`overflow-hidden rounded-md border bg-lol-navy-900/60 text-left transition-all hover:border-lol-border-gold hover:shadow-lol-glow-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lol-border-gold ${isSelectedSkin ? 'border-lol-border-gold shadow-lol-glow-gold' : 'border-lol-border-subtle'}`}
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
              <div className="p-2 text-xs text-lol-text-secondary">{skin.name}</div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
