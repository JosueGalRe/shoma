import { useTranslation } from 'react-i18next'

import { BottomSheet } from '@/components/ui/bottom-sheet'
import { useChampionDetail, useLatestDdragonVersion } from '@/core/http/ddragon-client'

import { abilityPreviewSheetStyles } from './ability-preview-sheet-styles'

import type { AbilityPreviewSheetProps } from './ability-preview-sheet-types'

function getSanitizedSpellDescription(description: string): string {
  return description
    .replace(/<br\s*\/?>(?<newline>\r?\n)?/gi, '\n')
    .replace(/<\/p>|<\/div>|<\/li>/gi, '\n')
    .replace(/<li>/gi, '• ')
    .replace(/<[^>]+>/g, '')
    .trim()
}

const SPELL_KEYS = ['Q', 'W', 'E', 'R'] as const

export function AbilityPreviewSheet({ championKey, isOpen, onClose }: AbilityPreviewSheetProps) {
  const { t } = useTranslation()
  const { data: version } = useLatestDdragonVersion()
  const { data: champion, isLoading, isError } = useChampionDetail(championKey ?? undefined)
  const styles = abilityPreviewSheetStyles()

  const spells = champion?.spells.slice(0, 4) ?? []

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title={champion?.name ?? t('champSelect.abilityPreview', { defaultValue: 'Abilities' })}
    >
      <div className="space-y-4">
        {isLoading && (
          <div className={styles.loadingRoot()}>
            {['skeleton-0', 'skeleton-1', 'skeleton-2', 'skeleton-3'].map((key) => {
              return (
                <div key={key} className={styles.loadingItem()}>
                  <div className={styles.loadingIcon()} />

                  <div className={styles.loadingContent()}>
                    <div className={styles.loadingTitle()} />

                    <div className={styles.loadingLine()} />

                    <div className={styles.loadingLineNarrow()} />
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {isError && (
          <div className={styles.error()}>
            {t('champSelect.abilityDataUnavailable', { defaultValue: 'Ability data unavailable' })}
          </div>
        )}

        {!isLoading && !isError && spells.length > 0 && (
          <div className="space-y-4">
            {spells.map((spell, index) => {
              return (
                <div key={spell.id} className={styles.spellRow()}>
                  <div className={styles.spellIconWrap()}>
                    <img
                      alt={spell.name}
                      className={styles.spellImage()}
                      src={
                        version ? `https://ddragon.leagueoflegends.com/cdn/${version}/img/spell/${spell.image.full}` : undefined
                      }
                    />

                    <div className={styles.spellKey()}>{SPELL_KEYS[index]}</div>
                  </div>

                  <div className={styles.spellContent()}>
                    <div className={styles.spellName()}>{spell.name}</div>

                    <div className={styles.spellDescription()} style={{ whiteSpace: 'pre-wrap' }}>
                      {getSanitizedSpellDescription(spell.description)}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </BottomSheet>
  )
}
