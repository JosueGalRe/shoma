import { useTranslation } from 'react-i18next'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { type RuneTree } from '@/core/http/ddragon-client'
import { RuneId, type RuneId as RuneIdType, type SpellId } from '@/core/types/branded'
import { type ModeRules } from '@/features/modes/mode-engine'

import { type SummonerSpell } from '../hooks/use-champ-select'
import { runeUrl } from '../utils'
import { SummonerPicker } from './summoner-picker'

interface PlayerSettingsProps {
  ddragonVersion: string | undefined
  modeRules: ModeRules
  onChangeRune: (runeId: RuneIdType) => void
  onChangeSpell: (slot: 1 | 2, spellId: SpellId) => void
  runeTrees: RuneTree[]
  selectedRuneId: RuneIdType | null
  selectedSpell1Id: SpellId | null
  selectedSpell2Id: SpellId | null
  summonerSpells: SummonerSpell[]
}

export function PlayerSettings({
  ddragonVersion,
  modeRules,
  onChangeRune,
  onChangeSpell,
  runeTrees,
  selectedRuneId,
  selectedSpell1Id,
  selectedSpell2Id,
  summonerSpells,
}: PlayerSettingsProps) {
  const { t } = useTranslation()
  const selectedRuneTree = runeTrees.find((tree) => tree.id === selectedRuneId) ?? null

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('champSelect.loadout')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {modeRules.usesSummonerSpells ? (
          <SummonerPicker
            ddragonVersion={ddragonVersion}
            onChangeSpell={onChangeSpell}
            selectedSpell1Id={selectedSpell1Id}
            selectedSpell2Id={selectedSpell2Id}
            summonerSpells={summonerSpells}
          />
        ) : null}

        {modeRules.usesRunes ? (
          <div className="space-y-2">
            <div className="font-display text-sm font-medium uppercase tracking-[0.18em] text-lol-gold">{t('champSelect.runes')}</div>
            <label className="block text-sm text-lol-text-secondary">
              {t('champSelect.chooseRune')}
              <select
                className="mt-1 w-full rounded-md border border-lol-border-subtle bg-lol-navy-950 p-2 text-lol-text-primary transition-colors focus:border-lol-border-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lol-border-gold"
                onChange={(event) => onChangeRune(RuneId(Number(event.target.value)))}
                value={selectedRuneId ?? ''}
              >
                <option value="">{t('champSelect.chooseRune')}</option>
                {runeTrees.map((tree) => (
                  <option key={tree.id} value={tree.id}>{tree.name}</option>
                ))}
              </select>
            </label>

            <div className="flex flex-wrap gap-2">
              {(selectedRuneTree?.slots.flatMap((slot) => slot.runes) ?? runeTrees.flatMap((tree) => tree.slots.flatMap((slot) => slot.runes))).slice(0, 12).map((rune) => (
                <img
                  alt={rune.name}
                  className="h-8 w-8 rounded-md border border-lol-border-subtle bg-lol-navy-950 object-cover shadow-lol-shadow-md"
                  key={rune.id}
                  loading="lazy"
                  src={runeUrl(ddragonVersion, rune.id) ?? undefined}
                  title={rune.name}
                />
              ))}
            </div>

            {selectedRuneTree ? <p className="text-xs text-lol-text-muted">{selectedRuneTree.name}</p> : null}
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
