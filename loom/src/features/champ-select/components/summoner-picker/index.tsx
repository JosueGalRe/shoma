import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { BottomSheet } from '@/components/ui/bottom-sheet'
import { IconGridSelector } from '@/components/ui/icon-grid-selector'
import type { SpellId as SpellIdType } from '@/core/types/branded'

import { summonerSpellUrl } from '../../utils'
import { SpellButton } from './spell-button'
import type { SummonerPickerProps } from './types'

export function SummonerPicker({
  summonerSpells,
  selectedSpell1Id,
  selectedSpell2Id,
  onChangeSpell,
  ddragonVersion,
}: SummonerPickerProps) {
  const { t } = useTranslation()
  const [activeSlot, setActiveSlot] = useState<1 | 2 | null>(null)

  const selectedSpell1 = summonerSpells.find((spell) => spell.id === selectedSpell1Id) ?? null
  const selectedSpell2 = summonerSpells.find((spell) => spell.id === selectedSpell2Id) ?? null

  const handleSelectSpell = (id: SpellIdType) => {
    if (activeSlot) {
      onChangeSpell(activeSlot, id)
      setActiveSlot(null)
    }
  }

  return (
    <div className='space-y-2'>
      <div className='font-display text-primary text-sm font-medium tracking-[0.18em] uppercase'>{t('champSelect.spells')}</div>
      <div className='space-y-3'>
        <label className='text-muted block text-sm'>
          {t('champSelect.spell1')}
          <div className='mt-1'>
            <SpellButton
              ddragonVersion={ddragonVersion}
              label={t('champSelect.chooseSpell')}
              spell={selectedSpell1}
              onClick={() => setActiveSlot(1)}
            />
          </div>
        </label>
        <label className='text-muted block text-sm'>
          {t('champSelect.spell2')}
          <div className='mt-1'>
            <SpellButton
              ddragonVersion={ddragonVersion}
              label={t('champSelect.chooseSpell')}
              spell={selectedSpell2}
              onClick={() => setActiveSlot(2)}
            />
          </div>
        </label>
      </div>

      <BottomSheet isOpen={activeSlot !== null} onClose={() => setActiveSlot(null)} title={t('champSelect.chooseSpell')}>
        <IconGridSelector
          items={summonerSpells.map((spell) => ({
            id: spell.id,
            iconUrl: summonerSpellUrl(ddragonVersion, spell) ?? '',
            name: spell.name,
            disabled: activeSlot === 1 ? spell.id === selectedSpell2Id : spell.id === selectedSpell1Id,
          }))}
          selectedId={activeSlot === 1 ? (selectedSpell1Id ?? undefined) : (selectedSpell2Id ?? undefined)}
          onSelect={handleSelectSpell}
          columns={3}
        />
      </BottomSheet>
    </div>
  )
}
