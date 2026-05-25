import { useTranslation } from 'react-i18next'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getModeNameKey } from '@/features/modes/mode-engine'

import { formatTimer } from '../champ-select-utils'

import { timerStyles } from './timer-styles'

import type { ChampSelectTimerProps } from './timer-types'

export function ChampSelectTimer({ phase, timer, isMyTurn, mode }: ChampSelectTimerProps) {
  const { t } = useTranslation()

  const totalTimeInPhase = phase === 'ban' ? 15 : 30
  const progressPercentage = Math.max(0, Math.min(100, (timer / totalTimeInPhase) * 100))
  let phaseLabelKey = 'champSelect.waiting'
  let timerState: 'normal' | 'warning' | 'critical' = 'normal'

  if (phase === 'ban') {
    phaseLabelKey = 'champSelect.ban'
  } else if (phase === 'pick') {
    phaseLabelKey = 'champSelect.pick'
  }

  let timerAnimationClass = ''

  if (timer === 0) {
    timerState = 'critical'
    timerAnimationClass = 'motion-safe:animate-shake-subtle'
  } else if (timer <= 10) {
    timerState = 'critical'
    timerAnimationClass = 'motion-safe:animate-pulse-fast'
  } else if (timer <= 20) {
    timerState = 'warning'
  }

  const timerViewStyles = timerStyles({ myTurn: isMyTurn, size: 'lg', state: timerState })

  return (
    <Card className={timerViewStyles.root()}>
      <div className={timerViewStyles.topAccent()} />

      <progress className={timerViewStyles.progress()} max={100} value={progressPercentage} />

      <CardHeader>
        <CardTitle className={timerViewStyles.title()}>{t('champSelect.title')}</CardTitle>
      </CardHeader>

      <CardContent className='grid gap-3 sm:grid-cols-3'>
        <div className={timerViewStyles.card()}>
          <div className={timerViewStyles.label()}>{t('champSelect.phase')}</div>

          <div className={timerViewStyles.phaseValue()}>{t(phaseLabelKey)}</div>

          <div className='text-muted text-xs'>{t(getModeNameKey(mode))}</div>
        </div>

        <div className={timerViewStyles.timerCard()}>
          <div className={timerViewStyles.label()}>{t('champSelect.timeLeft')}</div>

          <div className={`${timerViewStyles.timerValue()} ${timerAnimationClass}`.trim()}>{formatTimer(timer)}</div>
        </div>

        <div className={timerViewStyles.card()}>
          <div className={timerViewStyles.label()}>{t('champSelect.pick')}</div>

          <div className={timerViewStyles.turnValue()}>{isMyTurn ? t('champSelect.yourTurn') : t('champSelect.waiting')}</div>
        </div>
      </CardContent>
    </Card>
  )
}
