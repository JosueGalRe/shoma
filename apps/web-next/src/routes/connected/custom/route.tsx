import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Button, Card, CardContent, CardHeader, CardTitle, Input } from '@/components/ui'
import {
  botDifficulties,
  customGameMaps,
  useCustomGameStore,
  type BotDifficulty,
  type CustomGamePlayer,
} from '@/features/custom/custom-store'
import { useLobby } from '@/features/lobby'
import { gameModes } from '@/features/modes/mode-engine'

const customTeams: CustomGamePlayer['team'][] = ['blue', 'red', 'spectator']

function CustomRouteComponent() {
  const { t } = useTranslation()
  const { members } = useLobby()
  const roomName = useCustomGameStore((state) => state.roomName)
  const password = useCustomGameStore((state) => state.password)
  const mapId = useCustomGameStore((state) => state.mapId)
  const gameMode = useCustomGameStore((state) => state.gameMode)
  const players = useCustomGameStore((state) => state.players)
  const maxPlayers = useCustomGameStore((state) => state.maxPlayers)
  const isSpectatorEnabled = useCustomGameStore((state) => state.isSpectatorEnabled)
  const setRoomConfig = useCustomGameStore((state) => state.setRoomConfig)
  const addPlayer = useCustomGameStore((state) => state.addPlayer)
  const movePlayer = useCustomGameStore((state) => state.movePlayer)
  const addBot = useCustomGameStore((state) => state.addBot)
  const toggleSpectator = useCustomGameStore((state) => state.toggleSpectator)
  const [botDifficulty, setBotDifficulty] = useState<BotDifficulty>('intro')

  useEffect(() => {
    for (const member of members) {
      addPlayer({
        id: String(member.summonerId),
        name: member.displayName,
        team: 'blue',
        isBot: false,
      })
    }
  }, [addPlayer, members])

  function updateRoomConfig(nextConfig: Partial<{ roomName: string; password: string; mapId: number; gameMode: string }>) {
    setRoomConfig(
      nextConfig.roomName ?? roomName,
      nextConfig.password ?? password,
      nextConfig.mapId ?? mapId,
      nextConfig.gameMode ?? gameMode,
    )
  }

  return (
    <main className="space-y-4">
      <section className="space-y-1">
        <h2 className="text-xl font-display font-bold text-lol-gold">{t('custom.title')}</h2>
        <p className="text-sm text-lol-text-muted">{t('arena.partySize', { current: players.filter((player) => player.team !== 'spectator').length, max: maxPlayers })}</p>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>{t('custom.title')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <label className="space-y-1 text-sm text-lol-text-secondary">
            <span>{t('custom.roomName')}</span>
            <Input onChange={(event) => updateRoomConfig({ roomName: event.target.value })} placeholder={t('custom.roomName')} value={roomName} />
          </label>
          <label className="space-y-1 text-sm text-lol-text-secondary">
            <span>{t('custom.password')}</span>
            <Input onChange={(event) => updateRoomConfig({ password: event.target.value })} placeholder={t('custom.password')} type="password" value={password} />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="space-y-1 text-sm text-lol-text-secondary">
              <span>{t('custom.map')}</span>
              <select
                className="h-10 w-full rounded-md border border-lol-border-subtle bg-lol-navy-950 px-3 text-sm text-lol-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lol-border-gold"
                onChange={(event) => updateRoomConfig({ mapId: Number(event.target.value) })}
                value={mapId}
              >
                {customGameMaps.map((map) => (
                  <option key={map.id} value={map.id}>
                    {map.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-1 text-sm text-lol-text-secondary">
              <span>{t('custom.gameMode')}</span>
              <select
                className="h-10 w-full rounded-md border border-lol-border-subtle bg-lol-navy-950 px-3 text-sm text-lol-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lol-border-gold"
                onChange={(event) => updateRoomConfig({ gameMode: event.target.value })}
                value={gameMode}
              >
                {gameModes.map((mode) => (
                  <option key={mode} value={mode}>
                    {t(`modes.${mode === 'ranked-solo-duo' ? 'rankedSoloDuo' : mode === 'ranked-flex' ? 'rankedFlex' : mode === 'normal-draft' ? 'normalDraft' : mode}`)}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={toggleSpectator} type="button" variant={isSpectatorEnabled ? 'primary' : 'secondary'}>
              {t('custom.spectatorMode')}
            </Button>
            <Button type="button" variant="secondary">
              {t('custom.invitePlayer')}
            </Button>
            <Button type="button" variant="primary">
              {t('custom.startGame')}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('custom.addBot')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <label className="space-y-1 text-sm text-lol-text-secondary">
            <span>{t('custom.botDifficulty')}</span>
            <select
                className="h-10 w-full rounded-md border border-lol-border-subtle bg-lol-navy-950 px-3 text-sm text-lol-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lol-border-gold"
              onChange={(event) => setBotDifficulty(event.target.value as BotDifficulty)}
              value={botDifficulty}
            >
              {botDifficulties.map((difficulty) => (
                <option key={difficulty} value={difficulty}>
                  {difficultyLabel(t, difficulty)}
                </option>
              ))}
            </select>
          </label>
          <div className="grid gap-2 sm:grid-cols-3">
            {customTeams.map((team) => (
              <Button disabled={team === 'spectator' && !isSpectatorEnabled} key={team} onClick={() => addBot(botDifficulty, team)} type="button" variant="secondary">
                {t('custom.addBot')} - {teamLabel(t, team)}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      <section className="grid gap-4 md:grid-cols-3">
        <TeamPanel players={players.filter((player) => player.team === 'blue')} title={t('custom.blueTeam')} />
        <TeamPanel players={players.filter((player) => player.team === 'red')} title={t('custom.redTeam')} />
        <TeamPanel players={players.filter((player) => player.team === 'spectator')} title={t('custom.spectators')} />
      </section>
    </main>
  )

  function TeamPanel({ players: teamPlayers, title }: { players: CustomGamePlayer[]; title: string }) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          {teamPlayers.length === 0 ? <p className="text-sm text-lol-text-muted">{t('champSelect.noPlayersYet')}</p> : null}
          <ul className="space-y-3">
            {teamPlayers.map((player) => (
              <li key={player.id} className="space-y-2 rounded-md border border-lol-border-subtle p-3">
                <div>
                  <p className="font-medium text-lol-text-primary">{player.name}</p>
                  <p className="text-xs text-lol-text-muted">{player.isBot && player.botDifficulty ? difficultyLabel(t, player.botDifficulty) : t('lobby.member')}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {customTeams.map((team) => (
                    <Button
                      disabled={player.team === team || (team === 'spectator' && !isSpectatorEnabled)}
                      key={team}
                      onClick={() => movePlayer(player.id, team)}
                      size="sm"
                      type="button"
                      variant="secondary"
                    >
                      {t('custom.movePlayer')} {teamLabel(t, team)}
                    </Button>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    )
  }
}

function teamLabel(t: (key: string) => string, team: CustomGamePlayer['team']): string {
  if (team === 'blue') return t('custom.blueTeam')
  if (team === 'red') return t('custom.redTeam')
  return t('custom.spectators')
}

function difficultyLabel(t: (key: string) => string, difficulty: BotDifficulty): string {
  return t(`custom.difficulties.${difficulty}`)
}

export const Route = createFileRoute('/connected/custom')({
  component: CustomRouteComponent,
})
