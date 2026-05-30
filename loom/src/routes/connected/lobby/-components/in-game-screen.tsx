import { useLayoutEffect, useRef, useState } from 'react'

import { Swords } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { useGameStats } from '@/core/live-client/hooks'
import { getModeNameKey } from '@/features/modes/mode-engine'

import { lobbyStyles } from '../-styles'

import { mapModeToIcon } from './in-game-screen-utils'

import type { InGameScreenProps } from '../-types'

export function InGameScreen({ mode }: InGameScreenProps) {
  const { t } = useTranslation()
  const gameStats = useGameStats()
  const modeLabel = t(getModeNameKey(mode))
  const iconUrl = mapModeToIcon(mode)

  const baseTimeRef = useRef<{ gameTime: number; localTime: number } | null>(null)
  const [displayTime, setDisplayTime] = useState(0)

  useLayoutEffect(() => {
    const gameTime = gameStats.data?.gameTime

    if (gameTime !== undefined) {
      baseTimeRef.current = {
        gameTime,
        localTime: Date.now(),
      }

      queueMicrotask(() => {
        setDisplayTime(Math.floor(gameTime))
      })
    }
  }, [gameStats.data?.gameTime])

  useLayoutEffect(() => {
    const interval = setInterval(() => {
      setDisplayTime((prev) => {
        return prev + 1
      })
    }, 1000)

    return () => {
      clearInterval(interval)
    }
  }, [])

  const mins = Math.floor(displayTime / 60)
    .toString()
    .padStart(2, '0')
  const secs = (displayTime % 60).toString().padStart(2, '0')
  const timer = `${mins}:${secs}`

  return (
    <div className="flex h-full flex-col items-center justify-center p-4">
      <div className="flex w-full max-w-md flex-col gap-4">
        {/* Match info card */}
        <div className={lobbyStyles.inGameScreen.matchInfoCard}>
          <div className="flex flex-col gap-1">
            <span className={lobbyStyles.inGameScreen.matchInfoLabel}>{t('lobby.inGame')}</span>

            <span className="text-lg font-medium text-white">{modeLabel}</span>
          </div>

          <div className={lobbyStyles.inGameScreen.matchInfoIconContainer}>
            <img alt="" className="size-8 object-contain" src={iconUrl} />
          </div>
        </div>

        {/* Timer card */}
        <div className={lobbyStyles.inGameScreen.timerCard}>
          <span className="text-sm font-medium text-white/60">{t('lobby.elapsedTime')}</span>

          <span className={lobbyStyles.inGameScreen.timerText}>{timer}</span>

          <div className={lobbyStyles.inGameScreen.liveBadge}>
            <div className="size-2 animate-pulse rounded-full bg-[rgb(200,170,110)]" />

            <span className="text-xs font-bold tracking-widest text-[rgb(200,170,110)] uppercase">Live</span>
          </div>
        </div>

        {/* Status message */}
        <div className={lobbyStyles.inGameScreen.statusCard}>
          <Swords color="rgb(200,170,110)" size={18} />

          <span className="text-sm font-medium text-white/70">{t('lobby.inGameStatus')}</span>
        </div>
      </div>
    </div>
  )
}
