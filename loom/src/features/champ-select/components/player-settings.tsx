import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

import type { PlayerSettingsProps } from './player-settings-types'
import { RuneEditor } from './rune-editor'
import { SummonerPicker } from './summoner-picker'

export function PlayerSettings({
  ddragonVersion,
  modeRules,
  onChangeRune: _onChangeRune,
  onChangeSpell,
  runeTrees,
  selectedRuneId,
  selectedSpell1Id,
  selectedSpell2Id,
  summonerSpells,
}: PlayerSettingsProps) {
  const { t } = useTranslation()
  const [isRuneEditorOpen, setIsRuneEditorOpen] = useState(false)
  const selectedRuneTree =
    runeTrees.find((tree) => {
      return tree.id === selectedRuneId
    }) ?? null

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>{t('champSelect.loadout')}</CardTitle>
        </CardHeader>
        <CardContent className='space-y-3'>
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
            <div className='space-y-2'>
              <div className='font-display text-primary text-sm font-medium tracking-[0.18em] uppercase'>
                {t('champSelect.runes')}
              </div>

              <Button
                className='w-full justify-between'
                onClick={() => {
                  return setIsRuneEditorOpen(true)
                }}
                variant='secondary'
              >
                <span>{selectedRuneTree?.name ?? t('champSelect.chooseRune')}</span>
                <span className='text-muted'>{t('champSelect.editRunes', 'Edit Runes')}</span>
              </Button>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {modeRules.usesRunes && (
        <RuneEditor
          isOpen={isRuneEditorOpen}
          onClose={() => {
            return setIsRuneEditorOpen(false)
          }}
          runeTrees={runeTrees}
        />
      )}
    </>
  )
}
