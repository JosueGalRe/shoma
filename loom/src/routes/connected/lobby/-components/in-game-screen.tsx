import { Swords } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import type { GameMode } from '@/core/lcu/parsers/lobby'
import { getModeNameKey } from '@/features/modes/mode-engine'

const CD_CDN =
  'https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/content/src/leagueclient/gamemodeassets'

const GAME_MODE_ICONS: Record<string, string> = {
  sr: `${CD_CDN}/classic_sru/img/game-select-icon-default.png`,
  aram: `${CD_CDN}/aram/img/game-select-icon-default.png`,
  tft: `${CD_CDN}/tft/img/game-select-icon-default.png`,
  arena: `${CD_CDN}/cherry/img/game-select-icon-default.png`,
  rgm: `${CD_CDN}/shared/img/icon-rgm-empty.png`,
}

function mapModeToIcon(mode: GameMode): string {
  switch (mode) {
    case 'aram':
      return GAME_MODE_ICONS.aram
    case 'arena':
      return GAME_MODE_ICONS.arena

    case 'ranked-solo-duo':
    case 'ranked-flex':
    case 'normal-draft':
    case 'swiftplay':
    case 'clash':
    case 'custom':
    default:
      return GAME_MODE_ICONS.sr
  }
}

function useReliableTimer(startTime?: number) {
  const [now, setNow] = useState(Date.now())
  const effectiveStart = startTime ?? Date.now()

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(interval)
  }, [])

  const elapsed = Math.floor((now - effectiveStart) / 1000)
  const mins = Math.floor(elapsed / 60)
    .toString()
    .padStart(2, '0')
  const secs = (elapsed % 60).toString().padStart(2, '0')

  return `${mins}:${secs}`
}

interface InGameScreenProps {
  mode: GameMode
}

export function InGameScreen({ mode }: InGameScreenProps) {
  const { t } = useTranslation()
  const timer = useReliableTimer()
  const modeLabel = t(getModeNameKey(mode))
  const iconUrl = mapModeToIcon(mode)

  return (
    <div className='flex h-full flex-col p-4'>
      <div className='flex flex-col gap-4 pt-8'>
        {/* Match info card */}
        <div className='flex items-center justify-between rounded-2xl border border-[color-mix(in_srgb,rgb(200,170,110)_30%,transparent)] bg-[color-mix(in_srgb,rgb(10,20,40)_60%,transparent)] p-5 backdrop-blur-md'>
          <div className='flex flex-col gap-1'>
            <span className='text-xs font-bold tracking-widest text-[color-mix(in_srgb,rgb(200,170,110)_70%,transparent)] uppercase'>
              {t('lobby.inGame')}
            </span>
            <span className='text-lg font-medium text-white'>{modeLabel}</span>
          </div>
          <div className='flex size-12 items-center justify-center rounded-full border border-[color-mix(in_srgb,rgb(200,170,110)_40%,transparent)] bg-[color-mix(in_srgb,rgb(200,170,110)_10%,transparent)]'>
            <img alt='' className='size-8 object-contain' src={iconUrl} />
          </div>
        </div>

        {/* Timer card */}
        <div className='flex flex-col items-center justify-center gap-2 rounded-2xl border border-[color-mix(in_srgb,rgb(200,170,110)_20%,transparent)] bg-[color-mix(in_srgb,rgb(10,20,40)_40%,transparent)] py-12 backdrop-blur-md'>
          <span className='text-sm font-medium text-white/60'>{t('lobby.elapsedTime')}</span>
          <span className='text-6xl font-bold tracking-tight text-[rgb(200,170,110)] drop-shadow-[0_0_15px_color-mix(in_srgb,rgb(200,170,110)_40%,transparent)] tabular-nums'>
            {timer}
          </span>
          <div className='mt-4 flex items-center gap-2 rounded-full bg-[color-mix(in_srgb,rgb(200,170,110)_15%,transparent)] px-4 py-1.5'>
            <div className='size-2 animate-pulse rounded-full bg-[rgb(200,170,110)]' />
            <span className='text-xs font-bold tracking-widest text-[rgb(200,170,110)] uppercase'>Live</span>
          </div>
        </div>

        {/* Status message */}
        <div className='flex items-center justify-center gap-2 rounded-xl border border-[color-mix(in_srgb,rgb(200,170,110)_15%,transparent)] bg-[color-mix(in_srgb,rgb(10,20,40)_40%,transparent)] p-4 backdrop-blur-md'>
          <Swords color='rgb(200,170,110)' size={18} />
          <span className='text-sm font-medium text-white/70'>{t('lobby.inGameStatus')}</span>
        </div>
      </div>
    </div>
  )
}
