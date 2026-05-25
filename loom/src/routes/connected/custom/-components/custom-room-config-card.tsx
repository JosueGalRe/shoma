import { useTranslation } from 'react-i18next'

import { Button, Card, CardContent, CardHeader, CardTitle, Input } from '@/components/ui'
import { customGameMaps } from '@/features/custom/custom-store'
import { gameModes } from '@/features/modes/mode-engine'

import { customStyles } from '../-styles'

import type { CustomRoomConfigCardProps } from './custom-room-config-card-types'

export function CustomRoomConfigCard({
  roomName,
  password,
  mapId,
  gameMode,
  isSpectatorEnabled,
  updateRoomConfig,
  toggleSpectator,
}: CustomRoomConfigCardProps) {
  const { t } = useTranslation()

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('custom.title')}</CardTitle>
      </CardHeader>

      <CardContent className='space-y-3'>
        <label className='text-muted space-y-1 text-sm'>
          <span>{t('custom.roomName')}</span>

          <Input
            onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
              return updateRoomConfig({ roomName: event.target.value })
            }}
            placeholder={t('custom.roomName')}
            value={roomName}
          />
        </label>

        <label className='text-muted space-y-1 text-sm'>
          <span>{t('custom.password')}</span>

          <Input
            onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
              return updateRoomConfig({ password: event.target.value })
            }}
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
              onChange={(event) => {
                return updateRoomConfig({ mapId: Number(event.target.value) })
              }}
              value={mapId}
            >
              {customGameMaps.map((map) => {
                return (
                  <option key={map.id} value={map.id}>
                    {map.name}
                  </option>
                )
              })}
            </select>
          </label>

          <label className='text-muted space-y-1 text-sm'>
            <span>{t('custom.gameMode')}</span>

            <select
              className={customStyles.selectInput}
              onChange={(event) => {
                return updateRoomConfig({ gameMode: event.target.value })
              }}
              value={gameMode}
            >
              {gameModes.map((mode) => {
                return (
                  <option key={mode} value={mode}>
                    {(() => {
                      let modeTranslationKey: string = mode

                      if (mode === 'ranked-solo-duo') {
                        modeTranslationKey = 'rankedSoloDuo'
                      } else if (mode === 'ranked-flex') {
                        modeTranslationKey = 'rankedFlex'
                      } else if (mode === 'normal-draft') {
                        modeTranslationKey = 'normalDraft'
                      }

                      return t(`modes.${modeTranslationKey}`)
                    })()}
                  </option>
                )
              })}
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
  )
}
