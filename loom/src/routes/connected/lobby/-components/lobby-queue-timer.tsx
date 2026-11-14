import { text } from '@shoma/ui/text'
import { color } from '@shoma/ui/tokens/color.stylex'
import { create, props } from '@stylexjs/stylex'
import { useTranslation } from 'react-i18next'

import { formatMinutesSeconds } from '@/lib/format-time'

import type { LobbyQueueTimerProps } from './lobby-screen-types'

// Figma "Contador" (Arena lobby): the search's elapsed time and the client's estimate
export function LobbyQueueTimer({ estimatedTime, time }: LobbyQueueTimerProps) {
  const { t } = useTranslation()

  return (
    <div {...props(styles.root)}>
      <span {...props(text.marcellus16, styles.label)}>{t('queue.findingMatch')}</span>

      <span {...props(text.marcellus33, styles.time)}>{formatMinutesSeconds(time)}</span>

      {estimatedTime ? (
        <span {...props(text.marcellus16, styles.label, styles.estimate)}>
          {t('queue.estimated', { time: formatMinutesSeconds(estimatedTime) })}
        </span>
      ) : null}
    </div>
  )
}

const styles = create({
  estimate: {
    color: color.primary,
  },
  label: {
    textTransform: 'uppercase',
  },
  root: {
    alignItems: 'center',
    color: color.text,
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    // Readable over the banner's ornament
    textShadow: `0 1px 8px ${color.background}`,
  },
  time: {
    fontVariantNumeric: 'tabular-nums',
  },
})
