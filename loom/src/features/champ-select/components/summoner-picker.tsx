import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { BottomSheet } from '@/components/ui/bottom-sheet'
import { IconGridSelector } from '@/components/ui/icon-grid-selector'
import { type SpellId as SpellIdType } from '@/core/types/branded'

import { type SummonerSpell } from '../hooks/use-champ-select'
import { summonerSpellUrl } from '../utils'

interface SpellButtonProps {
  spell: SummonerSpell | null
  ddragonVersion: string | undefined
  label: string
  onClick: () => void
}

function SpellButton({ spell, ddragonVersion, label, onClick }: SpellButtonProps) {
  return (
    <button
      type="button"
      className="flex min-h-[44px] w-full items-center gap-3 rounded-md border border-border bg-background p-2 text-left transition-colors hover:border-primary/50 focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      onClick={onClick}
    >
      <img
        alt=""
        className="size-12 rounded-md border border-primary/40 bg-background object-cover shadow-md"
        loading="lazy"
        src={summonerSpellUrl(ddragonVersion, spell) ?? undefined}
      />
      <span className="text-sm text-foreground">
        {spell ? spell.name : label}
      </span>
    </button>
  )
}

interface SummonerPickerProps {
  summonerSpells: SummonerSpell[]
  selectedSpell1Id: SpellIdType | null
  selectedSpell2Id: SpellIdType | null
  onChangeSpell: (slot: 1 | 2, spellId: SpellIdType) => void
  ddragonVersion: string | undefined
}

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
    <div className="space-y-2">
      <div className="font-display text-sm font-medium uppercase tracking-[0.18em] text-primary">{t('champSelect.spells')}</div>
      <div className="space-y-3">
        <label className="block text-sm text-muted">
          {t('champSelect.spell1')}
          <div className="mt-1">
            <SpellButton
              ddragonVersion={ddragonVersion}
              label={t('champSelect.chooseSpell')}
              spell={selectedSpell1}
              onClick={() => setActiveSlot(1)}
            />
          </div>
        </label>
        <label className="block text-sm text-muted">
          {t('champSelect.spell2')}
          <div className="mt-1">
            <SpellButton
              ddragonVersion={ddragonVersion}
              label={t('champSelect.chooseSpell')}
              spell={selectedSpell2}
              onClick={() => setActiveSlot(2)}
            />
          </div>
        </label>
      </div>

      <BottomSheet
        isOpen={activeSlot !== null}
        onClose={() => setActiveSlot(null)}
        title={t('champSelect.chooseSpell')}
      >
        <IconGridSelector
          items={summonerSpells.map((spell) => ({
            id: spell.id,
            iconUrl: summonerSpellUrl(ddragonVersion, spell) ?? '',
            name: spell.name,
            disabled: activeSlot === 1 ? spell.id === selectedSpell2Id : spell.id === selectedSpell1Id,
          }))}
          selectedId={activeSlot === 1 ? selectedSpell1Id ?? undefined : selectedSpell2Id ?? undefined}
          onSelect={handleSelectSpell}
          columns={3}
        />
      </BottomSheet>
    </div>
  )
}
