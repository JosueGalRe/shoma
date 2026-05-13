import { ArrowLeftRight, RotateCw, Shield } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ROLE_ICONS } from '@/features/lobby/constants/role-icons'
import type { LobbyRole } from '@/features/lobby/lobby-store'
import { type ChampSelectMember } from '../champ-select-store'
import { ChampionIdentity } from './champion-identity'

function memberLabel(member: ChampSelectMember): string {
  return member.displayName ?? `#${member.cellId}`
}

function TeamPanel({
  championLabel,
  emptyLabel,
  members,
  title,
}: {
  championLabel: string
  emptyLabel: string
  members: ChampSelectMember[]
  title: string
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {members.length === 0 ? <p className="text-sm text-lol-text-muted">{emptyLabel}</p> : null}
        {members.map((member) => (
          <div className="flex items-center gap-3 rounded-md border border-lol-border-subtle bg-lol-navy-800/60 p-2" key={member.cellId}>
            {member.assignedPosition && member.assignedPosition.toUpperCase() !== 'UNSELECTED' && member.assignedPosition !== '' ? (
              <div className="flex size-8 shrink-0 items-center justify-center">
                <img alt={member.assignedPosition} className="size-6" src={ROLE_ICONS[member.assignedPosition.toUpperCase() as LobbyRole]} />
              </div>
            ) : (
              <div className="size-8 shrink-0" />
            )}
            <div className="min-w-0 flex-1">
              <div className="mb-1 flex items-center gap-2">
                <div className="truncate font-display text-sm font-medium uppercase tracking-[0.14em] text-lol-text-primary">{memberLabel(member)}</div>
                {member.championPickIntent && member.championPickIntent > 0 ? <Shield className="size-4 shrink-0 text-lol-gold" /> : null}
              </div>
              <div className="mt-1">
                {member.championId > 0 ? (
                  <ChampionIdentity championId={member.championId} size="sm" />
                ) : member.championPickIntent && member.championPickIntent > 0 ? (
                  <div className="w-fit rounded-md border border-lol-border-gold/50 p-1 opacity-70 motion-safe:animate-pulse">
                    <ChampionIdentity championId={member.championPickIntent} size="sm" />
                  </div>
                ) : (
                  <div className="flex h-8 items-center text-xs text-lol-text-muted">
                    {championLabel}:
                  </div>
                )}
              </div>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <button
                type="button"
                disabled
                className="flex min-h-[44px] min-w-[44px] items-center justify-center gap-1 rounded-md border border-blue-400/30 bg-lol-navy-900/60 text-xs text-blue-400 opacity-50"
                aria-label={`Swap Role with ${memberLabel(member)}`}
              >
                <RotateCw className="size-4" />
                <span className="hidden sm:inline">Swap Role</span>
              </button>
              <button
                type="button"
                disabled
                className="flex min-h-[44px] min-w-[44px] items-center justify-center gap-1 rounded-md border border-purple-400/30 bg-lol-navy-900/60 text-xs text-purple-400 opacity-50"
                aria-label={`Swap Pick with ${memberLabel(member)}`}
              >
                <ArrowLeftRight className="size-4" />
                <span className="hidden sm:inline">Swap Pick</span>
              </button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

interface ChampSelectMembersProps {
  team: ChampSelectMember[]
  enemyTeam: ChampSelectMember[]
}

export function ChampSelectMembers({ team, enemyTeam }: ChampSelectMembersProps) {
  const { t } = useTranslation()

  return (
    <section className="grid gap-4 md:grid-cols-2">
      <TeamPanel championLabel={t('champSelect.champion')} emptyLabel={t('champSelect.noPlayersYet')} members={team} title={t('champSelect.allyTeam')} />
      <TeamPanel championLabel={t('champSelect.champion')} emptyLabel={t('champSelect.noPlayersYet')} members={enemyTeam} title={t('champSelect.enemyTeam')} />
    </section>
  )
}
