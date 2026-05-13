import { useTranslation } from 'react-i18next'

import { BottomSheet } from '@/components/ui/bottom-sheet'
import { useChampionDetail, useLatestDdragonVersion } from '@/core/http/ddragon-client'

interface AbilityPreviewSheetProps {
  championKey: string | null
  isOpen: boolean
  onClose: () => void
}

export function AbilityPreviewSheet({ championKey, isOpen, onClose }: AbilityPreviewSheetProps) {
  const { t } = useTranslation()
  const { data: version } = useLatestDdragonVersion()
  const { data: champion, isLoading, isError } = useChampionDetail(championKey ?? undefined)

  // We only want the first 4 spells (Q, W, E, R)
  const spells = champion?.spells.slice(0, 4) ?? []
  const spellKeys = ['Q', 'W', 'E', 'R']

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title={champion?.name ?? t('champSelect.abilityPreview', { defaultValue: 'Abilities' })}>
      <div className="space-y-4">
        {isLoading && (
          <div className="space-y-4 animate-pulse">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="flex gap-3">
                <div className="h-12 w-12 shrink-0 rounded bg-lol-navy-800" />
                <div className="flex-1 space-y-2 py-1">
                  <div className="h-4 w-1/3 rounded bg-lol-navy-800" />
                  <div className="h-3 w-full rounded bg-lol-navy-800" />
                  <div className="h-3 w-5/6 rounded bg-lol-navy-800" />
                </div>
              </div>
            ))}
          </div>
        )}

        {isError && (
          <div className="py-8 text-center text-lol-text-muted">
            {t('champSelect.abilityDataUnavailable', { defaultValue: 'Ability data unavailable' })}
          </div>
        )}

        {!isLoading && !isError && spells.length > 0 && (
          <div className="space-y-4">
            {spells.map((spell, index) => (
              <div key={spell.id} className="flex gap-3">
                <div className="relative shrink-0">
                  <img
                    alt={spell.name}
                    className="h-12 w-12 rounded border border-lol-border-subtle object-cover"
                    src={version ? `https://ddragon.leagueoflegends.com/cdn/${version}/img/spell/${spell.image.full}` : undefined}
                  />
                  <div className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded bg-lol-navy-950 border border-lol-border-subtle text-[10px] font-bold text-lol-gold">
                    {spellKeys[index]}
                  </div>
                </div>
                <div className="flex-1">
                  <div className="font-display text-sm font-medium text-lol-text-primary">{spell.name}</div>
                  <div 
                    className="text-xs text-lol-text-muted line-clamp-3"
                    dangerouslySetInnerHTML={{ __html: spell.description }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </BottomSheet>
  )
}
