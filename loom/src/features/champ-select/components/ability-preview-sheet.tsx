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
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title={champion?.name ?? t('champSelect.abilityPreview', { defaultValue: 'Abilities' })}
    >
      <div className='space-y-4'>
        {isLoading && (
          <div className='animate-pulse space-y-4'>
            {['skeleton-0', 'skeleton-1', 'skeleton-2', 'skeleton-3'].map((key) => (
              <div key={key} className='flex gap-3'>
                <div className='bg-secondary size-12 shrink-0 rounded' />
                <div className='flex-1 space-y-2 py-1'>
                  <div className='bg-secondary h-4 w-1/3 rounded' />
                  <div className='bg-secondary h-3 w-full rounded' />
                  <div className='bg-secondary h-3 w-5/6 rounded' />
                </div>
              </div>
            ))}
          </div>
        )}

        {isError && (
          <div className='text-muted py-8 text-center'>
            {t('champSelect.abilityDataUnavailable', { defaultValue: 'Ability data unavailable' })}
          </div>
        )}

        {!isLoading && !isError && spells.length > 0 && (
          <div className='space-y-4'>
            {spells.map((spell, index) => (
              <div key={spell.id} className='flex gap-3'>
                <div className='relative shrink-0'>
                  <img
                    alt={spell.name}
                    className='border-border size-12 rounded border object-cover'
                    src={
                      version ? `https://ddragon.leagueoflegends.com/cdn/${version}/img/spell/${spell.image.full}` : undefined
                    }
                  />
                  <div className='bg-background border-border text-primary absolute -right-1 -bottom-1 flex size-5 items-center justify-center rounded border text-[10px] font-bold'>
                    {spellKeys[index]}
                  </div>
                </div>
                <div className='flex-1'>
                  <div className='font-display text-foreground text-sm font-medium'>{spell.name}</div>
                  <div className='text-muted line-clamp-3 text-xs' dangerouslySetInnerHTML={{ __html: spell.description }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </BottomSheet>
  )
}
