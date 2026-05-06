import { useTranslation } from 'react-i18next'

import { SpellId, type SpellId as SpellIdType } from '@/core/types/branded'

import { type SummonerSpell } from '../hooks/use-champ-select'
import { summonerSpellUrl } from '../utils'

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

  const selectedSpell1 = summonerSpells.find((spell) => spell.id === selectedSpell1Id) ?? null
  const selectedSpell2 = summonerSpells.find((spell) => spell.id === selectedSpell2Id) ?? null

  return (
    <div className="space-y-2">
      <div className="font-display text-sm font-medium uppercase tracking-[0.18em] text-lol-gold">{t('champSelect.spells')}</div>
      <label className="block text-sm text-lol-text-secondary">
        {t('champSelect.spell1')}
        <div className="mt-1 flex items-center gap-2">
          <img
            alt=""
            className="h-9 w-9 rounded-md border border-lol-border-gold/40 bg-lol-navy-950 object-cover shadow-lol-shadow-md"
            loading="lazy"
            src={summonerSpellUrl(ddragonVersion, selectedSpell1) ?? undefined}
          />
          <select
            className="w-full rounded-md border border-lol-border-subtle bg-lol-navy-950 p-2 text-lol-text-primary transition-colors focus:border-lol-border-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lol-border-gold"
            onChange={(event) => onChangeSpell(1, SpellId(Number(event.target.value)))}
            value={selectedSpell1Id ?? ''}
          >
            <option value="">{t('champSelect.chooseSpell')}</option>
            {summonerSpells.map((spell) => (
              <option key={spell.id} value={spell.id}>{spell.name}</option>
            ))}
          </select>
        </div>
      </label>
      <label className="block text-sm text-lol-text-secondary">
        {t('champSelect.spell2')}
        <div className="mt-1 flex items-center gap-2">
          <img
            alt=""
            className="h-9 w-9 rounded-md border border-lol-border-gold/40 bg-lol-navy-950 object-cover shadow-lol-shadow-md"
            loading="lazy"
            src={summonerSpellUrl(ddragonVersion, selectedSpell2) ?? undefined}
          />
          <select
            className="w-full rounded-md border border-lol-border-subtle bg-lol-navy-950 p-2 text-lol-text-primary transition-colors focus:border-lol-border-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lol-border-gold"
            onChange={(event) => onChangeSpell(2, SpellId(Number(event.target.value)))}
            value={selectedSpell2Id ?? ''}
          >
            <option value="">{t('champSelect.chooseSpell')}</option>
            {summonerSpells.map((spell) => (
              <option key={spell.id} value={spell.id}>{spell.name}</option>
            ))}
          </select>
        </div>
      </label>
    </div>
  )
}
