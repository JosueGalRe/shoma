import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { BottomSheet } from '@/components/ui/bottom-sheet'
import { IconGridSelector } from '@/components/ui/icon-grid-selector'
import type { SpellId as SpellIdType } from '@/core/types/branded'

import { summonerSpellUrl } from '../../champ-select-utils'
import { summonerPickerStyles } from '../summoner-picker-styles'
import { SpellButton } from './spell-button'
import type { SummonerPickerProps } from './summoner-picker-types'

export function SummonerPicker({
  summonerSpells,
  selectedSpell1Id,
  selectedSpell2Id,
  onChangeSpell,
  ddragonVersion,
}: SummonerPickerProps) {
  const { t } = useTranslation()
  const styles = summonerPickerStyles()
  const [activeSlot, setActiveSlot] = useState<1 | 2 | null>(null)

  const selectedSpell1 =
    summonerSpells.find((spell) => {
      return spell.id === selectedSpell1Id
    }) ?? null
  const selectedSpell2 =
    summonerSpells.find((spell) => {
      return spell.id === selectedSpell2Id
    }) ?? null

  const handleSelectSpell = (id: SpellIdType) => {
    if (activeSlot) {
      onChangeSpell(activeSlot, id)
      setActiveSlot(null)
    }
  }

  return (
    <div className={styles.root()}>
      <div className={styles.sectionTitle()}>{t('champSelect.spells')}</div>
      <div className={styles.spellList()}>
        <label className={styles.spellLabel()}>
          {t('champSelect.spell1')}
          <div className={styles.spellField()}>
            <SpellButton
              ddragonVersion={ddragonVersion}
              label={t('champSelect.chooseSpell')}
              spell={selectedSpell1}
              onClick={() => {
                return setActiveSlot(1)
              }}
            />
          </div>
        </label>
        <label className={styles.spellLabel()}>
          {t('champSelect.spell2')}
          <div className={styles.spellField()}>
            <SpellButton
              ddragonVersion={ddragonVersion}
              label={t('champSelect.chooseSpell')}
              spell={selectedSpell2}
              onClick={() => {
                return setActiveSlot(2)
              }}
            />
          </div>
        </label>
      </div>

      <BottomSheet
        isOpen={activeSlot !== null}
        onClose={() => {
          return setActiveSlot(null)
        }}
        title={t('champSelect.chooseSpell')}
      >
        <IconGridSelector
          items={summonerSpells.map((spell) => {
            return {
              id: spell.id,
              iconUrl: summonerSpellUrl(ddragonVersion, spell) ?? '',
              name: spell.name,
              disabled: activeSlot === 1 ? spell.id === selectedSpell2Id : spell.id === selectedSpell1Id,
            }
          })}
          selectedId={activeSlot === 1 ? (selectedSpell1Id ?? undefined) : (selectedSpell2Id ?? undefined)}
          onSelect={handleSelectSpell}
          columns={3}
        />
      </BottomSheet>
    </div>
  )
}
