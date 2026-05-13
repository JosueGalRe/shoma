import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { type RuneTree } from '@/core/http/ddragon-client'
import { type RuneId as RuneIdType, type SpellId } from '@/core/types/branded'
import { type ModeRules } from '@/features/modes/mode-engine'

import { type SummonerSpell } from '../hooks/use-champ-select'
import { RuneEditor } from './rune-editor'
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
  const [isRuneEditorOpen, setIsRuneEditorOpen] = useState(false)
  const selectedRuneTree = runeTrees.find((tree) => tree.id === selectedRuneId) ?? null

  return (
    <>
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
              
              <Button 
                className="w-full justify-between" 
                onClick={() => setIsRuneEditorOpen(true)}
                variant="secondary"
              >
                <span>{selectedRuneTree?.name ?? t('champSelect.chooseRune')}</span>
                <span className="text-lol-text-muted">{t('champSelect.editRunes', 'Edit Runes')}</span>
              </Button>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {modeRules.usesRunes && (
        <RuneEditor 
          isOpen={isRuneEditorOpen} 
          onClose={() => setIsRuneEditorOpen(false)} 
          runeTrees={runeTrees} 
        />
      )}
    </>
  )
}
