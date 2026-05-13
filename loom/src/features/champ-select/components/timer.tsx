import { useTranslation } from 'react-i18next'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getModeNameKey, type GameMode } from '@/features/modes/mode-engine'

import { formatTimer } from '../utils'

interface ChampSelectTimerProps {
  phase: string
  timer: number
  isMyTurn: boolean
  mode: GameMode
}

export function ChampSelectTimer({ phase, timer, isMyTurn, mode }: ChampSelectTimerProps) {
  const { t } = useTranslation()

  const totalTimeInPhase = phase === 'ban' ? 15 : 30
  const progressPercentage = Math.max(0, Math.min(100, (timer / totalTimeInPhase) * 100))

  let timerColorClass = 'text-lol-gold'
  let timerAnimationClass = ''
  let barColorClass = 'bg-lol-gold'

  if (timer === 0) {
    timerColorClass = 'text-red-600'
    timerAnimationClass = 'motion-safe:animate-shake-subtle'
    barColorClass = 'bg-red-600'
  } else if (timer <= 10) {
    timerColorClass = 'text-red-500'
    timerAnimationClass = 'motion-safe:animate-pulse-fast'
    barColorClass = 'bg-red-500'
  } else if (timer <= 20) {
    timerColorClass = 'text-yellow-400'
    barColorClass = 'bg-yellow-400'
  }

  return (
    <Card className="relative overflow-hidden border-lol-border-gold/30 bg-lol-navy-900/85">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-lol-gold/50" />
      <div
        className={`absolute left-0 top-0 h-1 transition-all duration-300 ${barColorClass}`}
        style={{ width: `${progressPercentage}%` }}
      />
      <CardHeader>
        <CardTitle className="text-center text-2xl uppercase tracking-[0.24em]">{t('champSelect.title')}</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-md border border-lol-border-subtle bg-lol-navy-800/60 p-3">
          <div className="text-xs uppercase tracking-[0.24em] text-lol-text-muted">{t('champSelect.phase')}</div>
          <div className="mt-1 font-display text-lg font-semibold capitalize text-lol-text-primary">
            {phase === 'ban' ? t('champSelect.ban') : phase === 'pick' ? t('champSelect.pick') : t('champSelect.waiting')}
          </div>
          <div className="text-xs text-lol-text-muted">{t(getModeNameKey(mode))}</div>
        </div>
        <div className="rounded-md border border-lol-border-gold/30 bg-lol-navy-950/70 p-3 text-center shadow-lol-shadow-md">
          <div className="text-xs uppercase tracking-[0.24em] text-lol-text-muted">{t('champSelect.timeLeft')}</div>
          <div className={`font-display text-3xl font-bold tabular-nums ${timerColorClass} ${timerAnimationClass}`.trim()}>
            {formatTimer(timer)}
          </div>
        </div>
        <div className="rounded-md border border-lol-border-subtle bg-lol-navy-800/60 p-3">
          <div className="text-xs uppercase tracking-[0.24em] text-lol-text-muted">{t('champSelect.pick')}</div>
          <div className={isMyTurn ? 'font-display text-lg font-semibold text-lol-gold' : 'font-display text-lg font-semibold text-lol-text-muted'}>
            {isMyTurn ? t('champSelect.yourTurn') : t('champSelect.waiting')}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
