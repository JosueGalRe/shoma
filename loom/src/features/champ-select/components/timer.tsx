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
  let phaseLabelKey = 'champSelect.waiting'

  if (phase === 'ban') {
    phaseLabelKey = 'champSelect.ban'
  } else if (phase === 'pick') {
    phaseLabelKey = 'champSelect.pick'
  }

  let timerColorClass = 'text-primary'
  let timerAnimationClass = ''
  let barColorClass = '[&::-moz-progress-bar]:bg-primary [&::-webkit-progress-value]:bg-primary'

  if (timer === 0) {
    timerColorClass = 'text-destructive'
    timerAnimationClass = 'motion-safe:animate-shake-subtle'
    barColorClass = '[&::-moz-progress-bar]:bg-destructive [&::-webkit-progress-value]:bg-destructive'
  } else if (timer <= 10) {
    timerColorClass = 'text-destructive'
    timerAnimationClass = 'motion-safe:animate-pulse-fast'
    barColorClass = '[&::-moz-progress-bar]:bg-destructive [&::-webkit-progress-value]:bg-destructive'
  } else if (timer <= 20) {
    timerColorClass = 'text-accent'
    barColorClass = '[&::-moz-progress-bar]:bg-accent [&::-webkit-progress-value]:bg-accent'
  }

  return (
    <Card className='border-primary/30 bg-secondary/85 relative overflow-hidden'>
      <div className='bg-primary/50 pointer-events-none absolute inset-x-0 top-0 h-px' />
      <progress
        className={`absolute top-0 left-0 h-1 w-full appearance-none bg-transparent transition-all duration-300 [&::-webkit-progress-bar]:bg-transparent ${barColorClass}`}
        max={100}
        value={progressPercentage}
      />
      <CardHeader>
        <CardTitle className='text-center text-2xl tracking-[0.24em] uppercase'>{t('champSelect.title')}</CardTitle>
      </CardHeader>
      <CardContent className='grid gap-3 sm:grid-cols-3'>
        <div className='border-border bg-secondary/60 rounded-md border p-3'>
          <div className='text-muted text-xs tracking-[0.24em] uppercase'>{t('champSelect.phase')}</div>
          <div className='font-display text-foreground mt-1 text-lg font-semibold capitalize'>
            {t(phaseLabelKey)}
          </div>
          <div className='text-muted text-xs'>{t(getModeNameKey(mode))}</div>
        </div>
        <div className='border-primary/30 bg-background/70 rounded-md border p-3 text-center shadow-md'>
          <div className='text-muted text-xs tracking-[0.24em] uppercase'>{t('champSelect.timeLeft')}</div>
          <div className={`font-display text-3xl font-bold tabular-nums ${timerColorClass} ${timerAnimationClass}`.trim()}>
            {formatTimer(timer)}
          </div>
        </div>
        <div className='border-border bg-secondary/60 rounded-md border p-3'>
          <div className='text-muted text-xs tracking-[0.24em] uppercase'>{t('champSelect.pick')}</div>
          <div
            className={
              isMyTurn ? 'font-display text-primary text-lg font-semibold' : 'font-display text-muted text-lg font-semibold'
            }
          >
            {isMyTurn ? t('champSelect.yourTurn') : t('champSelect.waiting')}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
