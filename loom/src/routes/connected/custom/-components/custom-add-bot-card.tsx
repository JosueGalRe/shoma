import { useTranslation } from 'react-i18next'

import { Button, Card, CardContent, CardHeader, CardTitle } from '@/components/ui'
import { botDifficulties } from '@/features/custom/custom-store';
import type { BotDifficulty } from '@/features/custom/custom-store';
import type { CustomGamePlayer } from '@/features/custom/custom-store';

import { customTeams, difficultyLabel, teamLabel } from './custom-players-utils'
import { customStyles } from '../-styles'
import { isBotDifficulty } from '../-custom-route-utils'

interface CustomAddBotCardProps {
  botDifficulty: BotDifficulty
  setBotDifficulty: (difficulty: BotDifficulty) => void
  isSpectatorEnabled: boolean
  addBot: (difficulty: BotDifficulty, team: CustomGamePlayer['team']) => void
}

export function CustomAddBotCard({
  botDifficulty,
  setBotDifficulty,
  isSpectatorEnabled,
  addBot,
}: CustomAddBotCardProps) {
  const { t } = useTranslation()

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('custom.addBot')}</CardTitle>
      </CardHeader>
      <CardContent className='space-y-3'>
        <label className='text-muted space-y-1 text-sm'>
          <span>{t('custom.botDifficulty')}</span>
          <select
            className={customStyles.selectInput}
            onChange={(event) => {
              const nextDifficulty = event.target.value
              if (isBotDifficulty(nextDifficulty)) {
                setBotDifficulty(nextDifficulty)
              }
            }}
            value={botDifficulty}
          >
            {botDifficulties.map((difficulty) => (
              <option key={difficulty} value={difficulty}>
                {difficultyLabel(t, difficulty)}
              </option>
            ))}
          </select>
        </label>
        <div className='grid gap-2 sm:grid-cols-3'>
          {customTeams.map((team) => (
            <Button
              disabled={team === 'spectator' && !isSpectatorEnabled}
              key={team}
              onClick={() => addBot(botDifficulty, team)}
              type='button'
              variant='secondary'
            >
              {t('custom.addBot')} - {teamLabel(t, team)}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
