import { useMemo } from 'react'

import { useTranslation } from 'react-i18next'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui'
import { type ClashTeamMember, useClashStore } from '@/features/clash/clash-store'
import { useLobby } from '@/features/lobby'

import { formatTimer, phaseLabelKeys } from './-utils'

export function ClashRouteComponent() {
  const { t } = useTranslation()
  const { viewModel } = useLobby()
  const members = useMemo<ClashTeamMember[]>(() => {
    return viewModel.members.map((member) => {
      return {
        isCaptain: member.isLeader,
        name: member.displayName,
        role: member.firstPositionPreference,
        summonerId: member.summonerId,
      }
    })
  }, [viewModel.members])
  const teamName = t('clash.team')
  const tickets = useClashStore((state) => {
    return state.tickets
  })
  const isEligible = members.length === 5
  const phase = useClashStore((state) => {
    return state.phase
  })
  const checkInTimeRemaining = useClashStore((state) => {
    return state.checkInTimeRemaining
  })
  const lockInTimeRemaining = useClashStore((state) => {
    return state.lockInTimeRemaining
  })
  const opponentTeam = useClashStore((state) => {
    return state.opponentTeam
  })
  const bracket = useClashStore((state) => {
    return state.bracket
  })

  let activeTimer: number | null = null
  let activeTimerLabelKey: string | null = null

  if (phase === 'check-in') {
    activeTimer = checkInTimeRemaining
    activeTimerLabelKey = 'clash.checkIn'
  } else if (phase === 'lock-in') {
    activeTimer = lockInTimeRemaining
    activeTimerLabelKey = 'clash.lockIn'
  }

  const phaseLabel = t(phaseLabelKeys[phase])
  const phaseText = `${t('clash.phase')}: ${phaseLabel}`
  const ticketsText = `${t('clash.tickets')}: ${tickets}`

  return (
    <main className="space-y-4 p-4">
      <section className="space-y-1">
        <h2 className="font-display text-primary text-xl font-semibold">{t('clash.title')}</h2>

        <p className="text-muted text-sm">{phaseText}</p>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>{t('clash.team')}</CardTitle>
        </CardHeader>

        <CardContent className="text-muted space-y-3 text-sm">
          <p className="text-foreground font-medium">{teamName || t('clash.team')}</p>

          <p className={isEligible ? 'text-primary' : 'text-destructive'}>
            {isEligible ? t('clash.eligible') : t('clash.notEligible')}
          </p>

          <p>{ticketsText}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('clash.members')}</CardTitle>
        </CardHeader>

        <CardContent>
          <ul className="space-y-2">
            {members.map((member) => {
              const memberName = member.isCaptain ? `${member.name} (${t('clash.captain')})` : member.name
              const roleText = `${t('clash.role')}: ${t(`lobby.roles.${member.role.toLowerCase()}`)}`

              return (
                <li key={member.summonerId} className="border-border bg-secondary/40 text-muted rounded-md border p-3 text-sm">
                  <p className="text-foreground font-medium">{memberName}</p>

                  <p className="text-muted text-xs">{roleText}</p>
                </li>
              )
            })}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('clash.phase')}</CardTitle>
        </CardHeader>

        <CardContent className="text-muted space-y-2 text-sm">
          <p>{phaseLabel}</p>

          {activeTimer !== null && activeTimerLabelKey ? (
            <p>{`${t(activeTimerLabelKey)}: ${formatTimer(activeTimer)}`}</p>
          ) : null}
        </CardContent>
      </Card>

      {phase === 'scouting' ? (
        <Card>
          <CardHeader>
            <CardTitle>{t('clash.scouting')}</CardTitle>
          </CardHeader>

          <CardContent className="text-muted space-y-3 text-sm">
            <p>{`${t('clash.opponent')}: ${opponentTeam?.name ?? t('clash.opponent')}`}</p>

            <ul className="space-y-2">
              {opponentTeam?.members.map((member) => {
                const roleText = `${t('clash.role')}: ${t(`lobby.roles.${member.role.toLowerCase()}`)}`

                return (
                  <li key={member.summonerId} className="border-border bg-secondary/40 rounded-md border p-3">
                    <p className="text-foreground font-medium">{member.name}</p>

                    <p className="text-muted text-xs">{roleText}</p>
                  </li>
                )
              })}
            </ul>
          </CardContent>
        </Card>
      ) : null}

      {phase === 'bracket' ? (
        <Card>
          <CardHeader>
            <CardTitle>{t('clash.bracket')}</CardTitle>
          </CardHeader>

          <CardContent className="text-muted space-y-3 text-sm">
            {bracket.map((round) => {
              return (
                <section key={round.round} className="space-y-2">
                  <h3 className="font-display text-primary font-medium">{`${t('clash.round')} ${round.round}`}</h3>

                  <ul className="space-y-2">
                    {round.matches.map((match) => {
                      const matchText = `${match.teamA} ${t('clash.versus')} ${match.teamB}`

                      return (
                        <li
                          key={`${round.round}-${match.teamA}-${match.teamB}`}
                          className="border-border bg-secondary/40 rounded-md border p-3"
                        >
                          {matchText}

                          {match.winner ? <span className="text-primary"> - {match.winner}</span> : null}
                        </li>
                      )
                    })}
                  </ul>
                </section>
              )
            })}
          </CardContent>
        </Card>
      ) : null}
    </main>
  )
}
