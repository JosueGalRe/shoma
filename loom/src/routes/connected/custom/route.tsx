import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { PageHeader } from '@/components/page-header'
import { Button, Card, CardContent, CardHeader, CardTitle, Input } from '@/components/ui'
import { botDifficulties, customGameMaps, useCustomGameStore } from '@/features/custom/custom-store';
import type { CustomGamePlayer } from '@/features/custom/custom-store';
import type { BotDifficulty } from '@/features/custom/custom-store';
import { gameModes } from '@/features/modes/mode-engine'

import { customTeams, difficultyLabel, teamLabel, useCustomDisplayPlayers } from './-components/custom-players-utils'
import { TeamPanel } from './-components/team-panel'
import { getModeTranslationKey, isBotDifficulty } from './-custom-route-utils'
import { customStyles } from './-styles'

function CustomRouteComponent() {
  const { t } = useTranslation()
  const roomName = useCustomGameStore((state) => {return state.roomName})
  const password = useCustomGameStore((state) => {return state.password})
  const mapId = useCustomGameStore((state) => {return state.mapId})
  const gameMode = useCustomGameStore((state) => {return state.gameMode})
  const maxPlayers = useCustomGameStore((state) => {return state.maxPlayers})
  const isSpectatorEnabled = useCustomGameStore((state) => {return state.isSpectatorEnabled})
  const setRoomConfig = useCustomGameStore((state) => {return state.setRoomConfig})
  const addBot = useCustomGameStore((state) => {return state.addBot})
  const toggleSpectator = useCustomGameStore((state) => {return state.toggleSpectator})
  const [botDifficulty, setBotDifficulty] = useState<BotDifficulty>('intro')
  const displayPlayers = useCustomDisplayPlayers()

  function updateRoomConfig(nextConfig: Partial<{ roomName: string; password: string; mapId: number; gameMode: string }>) {
    setRoomConfig(
      nextConfig.roomName ?? roomName,
      nextConfig.password ?? password,
      nextConfig.mapId ?? mapId,
      nextConfig.gameMode ?? gameMode,
    )
  }

  return (
    <main className='space-y-4 p-4'>
      <PageHeader
        title={t('custom.title')}
        subtitle={t('arena.partySize', {
          current: displayPlayers.filter((player: CustomGamePlayer) => {return player.team !== 'spectator'}).length,
          max: maxPlayers,
        })}
      />

      <Card>
        <CardHeader>
          <CardTitle>{t('custom.title')}</CardTitle>
        </CardHeader>
        <CardContent className='space-y-3'>
          <label className='text-muted space-y-1 text-sm'>
            <span>{t('custom.roomName')}</span>
            <Input
              onChange={(event: React.ChangeEvent<HTMLInputElement>) => {return updateRoomConfig({ roomName: event.target.value })}}
              placeholder={t('custom.roomName')}
              value={roomName}
            />
          </label>
          <label className='text-muted space-y-1 text-sm'>
            <span>{t('custom.password')}</span>
            <Input
              onChange={(event: React.ChangeEvent<HTMLInputElement>) => {return updateRoomConfig({ password: event.target.value })}}
              placeholder={t('custom.password')}
              type='password'
              value={password}
            />
          </label>
          <div className='grid gap-3 sm:grid-cols-2'>
            <label className='text-muted space-y-1 text-sm'>
              <span>{t('custom.map')}</span>
              <select
                className={customStyles.selectInput}
                onChange={(event) => {return updateRoomConfig({ mapId: Number(event.target.value) })}}
                value={mapId}
              >
                {customGameMaps.map((map) => {return (
                  <option key={map.id} value={map.id}>
                    {map.name}
                  </option>
                )})}
              </select>
            </label>
            <label className='text-muted space-y-1 text-sm'>
              <span>{t('custom.gameMode')}</span>
              <select
                className={customStyles.selectInput}
                onChange={(event) => {return updateRoomConfig({ gameMode: event.target.value })}}
                value={gameMode}
              >
                {gameModes.map((mode) => {return (
                  <option key={mode} value={mode}>
                    {t(`modes.${getModeTranslationKey(mode)}`)}
                  </option>
                )})}
              </select>
            </label>
          </div>
          <div className='flex flex-wrap gap-2'>
            <Button onClick={toggleSpectator} type='button' variant={isSpectatorEnabled ? 'primary' : 'secondary'}>
              {t('custom.spectatorMode')}
            </Button>
            <Button type='button' variant='secondary'>
              {t('custom.invitePlayer')}
            </Button>
            <Button type='button' variant='primary'>
              {t('custom.startGame')}
            </Button>
          </div>
        </CardContent>
      </Card>

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
              {botDifficulties.map((difficulty) => {return (
                <option key={difficulty} value={difficulty}>
                  {difficultyLabel(t, difficulty)}
                </option>
              )})}
            </select>
          </label>
          <div className='grid gap-2 sm:grid-cols-3'>
            {customTeams.map((team: CustomGamePlayer['team']) => {return (
              <Button
                disabled={team === 'spectator' && !isSpectatorEnabled}
                key={team}
                onClick={() => {return addBot(botDifficulty, team)}}
                type='button'
                variant='secondary'
              >
                {t('custom.addBot')} - {teamLabel(t, team)}
              </Button>
            )})}
          </div>
        </CardContent>
      </Card>

      <section className='grid gap-4 md:grid-cols-3'>
        <TeamPanel team='blue' title={t('custom.blueTeam')} />
        <TeamPanel team='red' title={t('custom.redTeam')} />
        <TeamPanel team='spectator' title={t('custom.spectators')} />
      </section>
    </main>
  )
}

export const Route = createFileRoute('/connected/custom')({
  component: CustomRouteComponent,
})
