import { useTranslation } from 'react-i18next'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { ChampionId } from '@/core/types/branded'
import { type ChampSelectMember } from '../champ-select-store'

function championIconUrl(championId: ChampionId): string | undefined {
  return championId > 0 ? `https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/champion-icons/${championId}.png` : undefined
}

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
            <div className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-md border border-lol-border-gold/40 bg-lol-navy-950">
              {member.championId > 0 ? <img alt="" className="h-full w-full object-cover" loading="lazy" src={championIconUrl(member.championId)} /> : <span className="text-lol-gold">◇</span>}
            </div>
            <div className="min-w-0">
              <div className="truncate font-display text-sm font-medium uppercase tracking-[0.14em] text-lol-text-primary">{memberLabel(member)}</div>
              <div className="text-xs text-lol-text-muted">
                {championLabel}: {member.championId || member.championPickIntent || '—'}
                {member.assignedPosition ? ` · ${member.assignedPosition}` : ''}
              </div>
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
