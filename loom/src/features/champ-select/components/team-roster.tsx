import { RosterRow } from './roster-row'

import type { ChampSelectMember } from '../champ-select-actions'
import type { ChampionSummary } from '@/core/http/ddragon'
import type { SummonerSpell } from '@/core/lcu/queries/summoner'

export interface TeamRosterProps {
  activeCellId: number | null
  champions: ChampionSummary[]
  hiddenNameLabel: string
  isEnemy: boolean
  members: ChampSelectMember[]
  roleLabel: (position: string | undefined) => string | null
  summonerSpells: SummonerSpell[]
  title: string
}

export function TeamRoster({
  activeCellId,
  champions,
  hiddenNameLabel,
  isEnemy,
  members,
  roleLabel,
  summonerSpells,
  title,
}: TeamRosterProps) {
  return (
    <section aria-label={title} className="space-y-1.5">
      <h2 className="text-muted font-display text-[11px] tracking-[0.24em] uppercase">{title}</h2>

      <div className="space-y-1.5">
        {members.map((member) => {
          return (
            <RosterRow
              champions={champions}
              hiddenNameLabel={hiddenNameLabel}
              isActiveTurn={activeCellId === member.cellId}
              isEnemy={isEnemy}
              key={member.cellId}
              member={member}
              roleLabel={roleLabel(member.assignedPosition)}
              summonerSpells={summonerSpells}
            />
          )
        })}
      </div>
    </section>
  )
}
