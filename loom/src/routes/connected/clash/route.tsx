import { createFileRoute } from '@tanstack/react-router'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui'
import { useClashStore, type ClashState, type ClashTeamMember } from '@/features/clash/clash-store'
import { useLobby } from '@/features/lobby'

const phaseLabelKeys = {
  registration: 'clash.title',
  'check-in': 'clash.checkIn',
  'lock-in': 'clash.lockIn',
  scouting: 'clash.scouting',
  bracket: 'clash.bracket',
} as const satisfies Record<ClashState['phase'], string>

function formatTimer(seconds: number) {
  const safeSeconds = Math.max(0, seconds)
  const minutes = Math.floor(safeSeconds / 60)
  const remainingSeconds = safeSeconds % 60

  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
}

function ClashRouteComponent() {
  const { t } = useTranslation()
  const { viewModel } = useLobby()
  const members = useMemo<ClashTeamMember[]>(
    () =>
      viewModel.members.map((member) => ({
        isCaptain: member.isLeader,
        name: member.displayName,
        role: member.firstPositionPreference,
        summonerId: member.summonerId,
      })),
    [viewModel.members],
  )
  const teamName = t('clash.team')
  const tickets = useClashStore((state) => state.tickets)
  const isEligible = members.length === 5
  const phase = useClashStore((state) => state.phase)
  const checkInTimeRemaining = useClashStore((state) => state.checkInTimeRemaining)
  const lockInTimeRemaining = useClashStore((state) => state.lockInTimeRemaining)
  const opponentTeam = useClashStore((state) => state.opponentTeam)
  const bracket = useClashStore((state) => state.bracket)

  const activeTimer = phase === 'check-in' ? checkInTimeRemaining : phase === 'lock-in' ? lockInTimeRemaining : null
  const phaseLabel = t(phaseLabelKeys[phase])

  return (
    <main className="space-y-4 p-4">
      <section className="space-y-1">
        <h2 className="font-display text-xl font-semibold text-primary">{t('clash.title')}</h2>
        <p className="text-sm text-muted">
          {t('clash.phase')}: {phaseLabel}
        </p>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>{t('clash.team')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted">
          <p className="font-medium text-foreground">{teamName || t('clash.team')}</p>
          <p className={isEligible ? 'text-primary' : 'text-destructive'}>{isEligible ? t('clash.eligible') : t('clash.notEligible')}</p>
          <p>
            {t('clash.tickets')}: {tickets}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('clash.members')}</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {members.map((member) => (
              <li key={member.summonerId} className="rounded-md border border-border bg-secondary/40 p-3 text-sm text-muted">
                <p className="font-medium text-foreground">
                  {member.name} {member.isCaptain ? `(${t('clash.captain')})` : ''}
                </p>
                <p className="text-xs text-muted">
                  {t('clash.role')}: {t(`lobby.roles.${member.role.toLowerCase()}`)}
                </p>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('clash.phase')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted">
          <p>{phaseLabel}</p>
          {activeTimer !== null ? (
            <p>
              {t(phase === 'check-in' ? 'clash.checkIn' : 'clash.lockIn')}: {formatTimer(activeTimer)}
            </p>
          ) : null}
        </CardContent>
      </Card>

      {phase === 'scouting' ? (
        <Card>
          <CardHeader>
            <CardTitle>{t('clash.scouting')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted">
            <p>
              {t('clash.opponent')}: {opponentTeam?.name ?? t('clash.opponent')}
            </p>
            <ul className="space-y-2">
              {opponentTeam?.members.map((member) => (
                <li key={member.summonerId} className="rounded-md border border-border bg-secondary/40 p-3">
                  <p className="font-medium text-foreground">{member.name}</p>
                  <p className="text-xs text-muted">
                    {t('clash.role')}: {t(`lobby.roles.${member.role.toLowerCase()}`)}
                  </p>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}

      {phase === 'bracket' ? (
        <Card>
          <CardHeader>
            <CardTitle>{t('clash.bracket')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted">
            {bracket.map((round) => (
              <section key={round.round} className="space-y-2">
                <h3 className="font-display font-medium text-primary">
                  {t('clash.round')} {round.round}
                </h3>
                <ul className="space-y-2">
                  {round.matches.map((match) => (
                    <li key={`${round.round}-${match.teamA}-${match.teamB}`} className="rounded-md border border-border bg-secondary/40 p-3">
                      {match.teamA} {t('clash.versus')} {match.teamB}
                      {match.winner ? <span className="text-primary"> - {match.winner}</span> : null}
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </CardContent>
        </Card>
      ) : null}
    </main>
  )
}

export const Route = createFileRoute('/connected/clash')({
  component: ClashRouteComponent,
})
