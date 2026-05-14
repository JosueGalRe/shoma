import { Check, Clock, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Avatar } from '@/components/ui/avatar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

import { useReadyCheckStore } from '../ready-check-store'

export function PremadeReadyCheckOverlay({ isSwiftplay }: { isSwiftplay: boolean }) {
  const { t } = useTranslation()
  const premade = useReadyCheckStore((state) => state.premade)

  if (!isSwiftplay || !premade.isActive || premade.members.length <= 1) {
    return null
  }

  const totalMembers = premade.members.length
  const acceptedCount = premade.members.filter((m) => m.status === 'accepted').length
  const percentage = totalMembers > 0 ? (acceptedCount / totalMembers) * 100 : 0

  const radius = 60
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (percentage / 100) * circumference

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="premade-ready-check-title"
      aria-live="polite"
    >
      <div className="w-full max-w-sm">
        <Card className="relative overflow-hidden rounded-2xl bg-secondary/95 shadow-2xl shadow-[0_0_24px_color-mix(in_srgb,var(--shoma-primary)_18%,transparent)]">
          <CardHeader className="space-y-2 pb-4 pt-8 text-center">
            <CardTitle id="premade-ready-check-title" className="font-display text-2xl tracking-[0.1em] text-primary">
              {t('readyCheck.premade.title', 'Party Ready Check')}
            </CardTitle>
            <p className="text-xs tracking-[0.1em] text-muted">
              {t('readyCheck.premade.subtitle', 'All members must accept to join queue')}
            </p>
          </CardHeader>

          <CardContent className="space-y-8 pt-2">
            <div className="flex justify-center">
              <div className="relative flex items-center justify-center">
                <svg className="size-40 -rotate-90 transform" viewBox="0 0 140 140">
                  <circle
                    className="text-background"
                    strokeWidth="8"
                    stroke="currentColor"
                    fill="transparent"
                    r={radius}
                    cx="70"
                    cy="70"
                  />
                  <circle
                    className="text-primary transition-all duration-500 ease-out motion-reduce:transition-none"
                    strokeWidth="8"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="transparent"
                    r={radius}
                    cx="70"
                    cy="70"
                  />
                </svg>
                <div className="absolute flex flex-col items-center justify-center">
                  <span className="font-display text-4xl text-foreground">
                    {acceptedCount}/{totalMembers}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {premade.members.map((member) => (
                <div key={member.summonerId} className="flex flex-col items-center gap-2">
                  <div className="relative">
                    <Avatar alt={member.displayName} src={member.iconUrl} size="md" />
                    <div
                      className={`absolute -bottom-1 -right-1 flex size-5 items-center justify-center rounded-full border-2 border-background ${
                        member.status === 'accepted'
                          ? 'bg-primary'
                          : member.status === 'declined'
                            ? 'bg-destructive'
                            : 'bg-primary'
                      }`}
                    >
                      {member.status === 'accepted' ? (
                        <Check className="size-3 text-foreground" />
                      ) : member.status === 'declined' ? (
                        <X className="size-3 text-foreground" />
                      ) : (
                        <Clock className="size-3 text-background" />
                      )}
                    </div>
                  </div>
                  <span className="max-w-full truncate text-xs text-foreground">
                    {member.displayName}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
