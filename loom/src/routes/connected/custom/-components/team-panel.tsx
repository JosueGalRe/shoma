import { useTranslation } from 'react-i18next'

import { Button, Card, CardContent, CardHeader, CardTitle } from '@/components/ui'
import { useCustomGameStore } from '@/features/custom/custom-store'
import type { CustomGamePlayer } from '@/features/custom/custom-store'

import { customTeams, difficultyLabel, teamLabel, useCustomDisplayPlayers } from './custom-players-utils'
import type { TeamPanelProps } from './team-panel-types'

export function TeamPanel({ team, title }: TeamPanelProps) {
  const { t } = useTranslation()
  const players = useCustomGameStore((state) => {
    return state.players
  })
  const isSpectatorEnabled = useCustomGameStore((state) => {
    return state.isSpectatorEnabled
  })
  const addPlayer = useCustomGameStore((state) => {
    return state.addPlayer
  })
  const movePlayer = useCustomGameStore((state) => {
    return state.movePlayer
  })
  const displayPlayers = useCustomDisplayPlayers()
  const teamPlayers = displayPlayers.filter((player) => {
    return player.team === team
  })

  function handleMovePlayer(player: CustomGamePlayer, nextTeam: CustomGamePlayer['team']) {
    if (
      !players.some((candidate) => {
        return candidate.id === player.id
      })
    ) {
      addPlayer({ ...player, team: nextTeam })
      return
    }

    movePlayer(player.id, nextTeam)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {teamPlayers.length === 0 ? <p className='text-muted text-sm'>{t('champSelect.noPlayersYet')}</p> : null}
        <ul className='space-y-3'>
          {teamPlayers.map((player) => {
            return (
              <li key={player.id} className='border-border space-y-2 rounded-md border p-3'>
                <div>
                  <p className='text-foreground font-medium'>{player.name}</p>
                  <p className='text-muted text-xs'>
                    {player.isBot && player.botDifficulty ? difficultyLabel(t, player.botDifficulty) : t('lobby.member')}
                  </p>
                </div>
                <div className='flex flex-wrap gap-2'>
                  {customTeams.map((team) => {
                    return (
                      <Button
                        disabled={player.team === team || (team === 'spectator' && !isSpectatorEnabled)}
                        key={team}
                        onClick={() => {
                          return handleMovePlayer(player, team)
                        }}
                        size='sm'
                        type='button'
                        variant='secondary'
                      >
                        {t('custom.movePlayer')} {teamLabel(t, team)}
                      </Button>
                    )
                  })}
                </div>
              </li>
            )
          })}
        </ul>
      </CardContent>
    </Card>
  )
}
