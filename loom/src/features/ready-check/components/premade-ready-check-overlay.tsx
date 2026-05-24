import { Check, Clock, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Avatar } from '@/components/ui/avatar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

import type { PremadeReadyCheckOverlayProps } from '../premade-ready-check-overlay-types'
import { useReadyCheckStore } from '../ready-check-store'
import { premadeReadyCheckOverlayStyles } from '../ready-check-styles'

export function PremadeReadyCheckOverlay({ isSwiftplay }: PremadeReadyCheckOverlayProps) {
  const { t } = useTranslation()
  const premade = useReadyCheckStore((state) => {
    return state.premade
  })
  const styles = premadeReadyCheckOverlayStyles()

  if (!isSwiftplay || !premade.isActive || premade.members.length <= 1) {
    return null
  }

  const totalMembers = premade.members.length
  const acceptedCount = premade.members.filter((m) => {
    return m.status === 'accepted'
  }).length
  const percentage = totalMembers > 0 ? (acceptedCount / totalMembers) * 100 : 0

  const radius = 60
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (percentage / 100) * circumference

  return (
    <div
      className={styles.overlay()}
      role='dialog'
      aria-modal='true'
      aria-labelledby='premade-ready-check-title'
      aria-live='polite'
    >
      <div className='w-full max-w-sm'>
        <Card className={styles.panel()}>
          <CardHeader className={styles.header()}>
            <CardTitle id='premade-ready-check-title' className={styles.title()}>
              {t('readyCheck.premade.title', 'Party Ready Check')}
            </CardTitle>
            <p className={styles.subtitle()}>{t('readyCheck.premade.subtitle', 'All members must accept to join queue')}</p>
          </CardHeader>

          <CardContent className={styles.content()}>
            <div className={styles.ringWrap()}>
              <div className={styles.ring()}>
                <svg className={styles.ringSvg()} viewBox='0 0 140 140'>
                  <circle
                    className={styles.ringTrack()}
                    strokeWidth='8'
                    stroke='currentColor'
                    fill='transparent'
                    r={radius}
                    cx='70'
                    cy='70'
                  />
                  <circle
                    className={styles.ringProgress()}
                    strokeWidth='8'
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap='round'
                    stroke='currentColor'
                    fill='transparent'
                    r={radius}
                    cx='70'
                    cy='70'
                  />
                </svg>
                <div className={styles.countWrap()}>
                  <span className={styles.count()}>
                    {acceptedCount}/{totalMembers}
                  </span>
                </div>
              </div>
            </div>

            <div className={styles.membersGrid()}>
              {premade.members.map((member) => {
                return (
                  <div key={member.summonerId} className={styles.member()}>
                    <div className={styles.memberAvatarWrap()}>
                      <Avatar alt={member.displayName} src={member.iconUrl} size='md' />
                      <div className={styles.memberStatus({ status: member.status })}>
                        {member.status === 'accepted' ? <Check className='text-foreground size-3' /> : null}
                        {member.status === 'declined' ? <X className='text-foreground size-3' /> : null}
                        {member.status === 'pending' ? <Clock className='text-background size-3' /> : null}
                      </div>
                    </div>
                    <span className={styles.memberName()}>{member.displayName}</span>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
