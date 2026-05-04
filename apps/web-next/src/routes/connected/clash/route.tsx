import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useMemo } from 'react'
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
  const { members: lobbyMembers } = useLobby()
  const teamName = useClashStore((state) => state.teamName)
  const members = useClashStore((state) => state.members)
  const tickets = useClashStore((state) => state.tickets)
  const isEligible = useClashStore((state) => state.isEligible)
  const phase = useClashStore((state) => state.phase)
  const checkInTimeRemaining = useClashStore((state) => state.checkInTimeRemaining)
  const lockInTimeRemaining = useClashStore((state) => state.lockInTimeRemaining)
  const opponentTeam = useClashStore((state) => state.opponentTeam)
  const bracket = useClashStore((state) => state.bracket)
  const setTeam = useClashStore((state) => state.setTeam)

  const lobbyTeam = useMemo<ClashTeamMember[]>(
    () =>
      lobbyMembers.map((member) => ({
        isCaptain: member.isLeader,
        name: member.displayName,
        role: member.firstPositionPreference,
        summonerId: String(member.summonerId),
      })),
    [lobbyMembers],
  )

  useEffect(() => {
    setTeam(teamName || t('clash.team'), lobbyTeam)
  }, [lobbyTeam, setTeam, t, teamName])

  const activeTimer = phase === 'check-in' ? checkInTimeRemaining : phase === 'lock-in' ? lockInTimeRemaining : null
  const phaseLabel = t(phaseLabelKeys[phase])

  return (
    <main className="space-y-4">
      <section className="space-y-1">
        <h2 className="text-xl font-bold text-white">{t('clash.title')}</h2>
        <p className="text-sm text-gray-400">
          {t('clash.phase')}: {phaseLabel}
        </p>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>{t('clash.team')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-gray-300">
          <p className="font-medium text-white">{teamName || t('clash.team')}</p>
          <p className={isEligible ? 'text-green-400' : 'text-red-300'}>{isEligible ? t('clash.eligible') : t('clash.notEligible')}</p>
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
              <li key={member.summonerId} className="rounded-md border border-gray-800 p-3 text-sm text-gray-300">
                <p className="font-medium text-white">
                  {member.name} {member.isCaptain ? `(${t('clash.captain')})` : ''}
                </p>
                <p className="text-xs text-gray-400">
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
        <CardContent className="space-y-2 text-sm text-gray-300">
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
          <CardContent className="space-y-3 text-sm text-gray-300">
            <p>
              {t('clash.opponent')}: {opponentTeam?.name ?? t('clash.opponent')}
            </p>
            <ul className="space-y-2">
              {opponentTeam?.members.map((member) => (
                <li key={member.summonerId} className="rounded-md border border-gray-800 p-3">
                  <p className="font-medium text-white">{member.name}</p>
                  <p className="text-xs text-gray-400">
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
          <CardContent className="space-y-3 text-sm text-gray-300">
            {bracket.map((round) => (
              <section key={round.round} className="space-y-2">
                <h3 className="font-medium text-white">
                  {t('clash.round')} {round.round}
                </h3>
                <ul className="space-y-2">
                  {round.matches.map((match) => (
                    <li key={`${round.round}-${match.teamA}-${match.teamB}`} className="rounded-md border border-gray-800 p-3">
                      {match.teamA} {t('clash.versus')} {match.teamB}
                      {match.winner ? <span className="text-green-400"> - {match.winner}</span> : null}
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
