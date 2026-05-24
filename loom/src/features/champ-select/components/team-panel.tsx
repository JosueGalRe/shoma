import { ArrowLeftRight, RotateCw, Shield } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ROLE_ICONS } from '@/features/lobby/constants/role-icons'

import { ChampionIdentity } from './champion-identity'
import { membersStyles } from './members-styles'
import type { TeamPanelProps } from './team-panel-types'
import { memberLabel, parseLobbyRole } from './team-panel-utils'

export function TeamPanel({
  championLabel,
  emptyLabel,
  members,
  title,
}: TeamPanelProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className='space-y-2'>
        {members.length === 0 ? <p className='text-muted text-sm'>{emptyLabel}</p> : null}
        {members.map((member) => {
          const role = member.assignedPosition ? parseLobbyRole(member.assignedPosition) : null

          return (
            <div className={membersStyles.memberCard} key={member.cellId}>
              {role !== null && role !== 'UNSELECTED' ? (
                <div className='flex size-8 shrink-0 items-center justify-center'>
                  <img alt={role} className='size-6' src={ROLE_ICONS[role]} />
                </div>
              ) : (
                <div className='size-8 shrink-0' />
              )}
              <div className='min-w-0 flex-1'>
                <div className='mb-1 flex items-center gap-2'>
                  <div className={membersStyles.memberName}>{memberLabel(member)}</div>
                  {member.championPickIntent && member.championPickIntent > 0 ? (
                    <Shield className='text-primary size-4 shrink-0' />
                  ) : null}
                </div>
                <div className='mt-1'>
                  {member.championId > 0 ? <ChampionIdentity championId={member.championId} size='sm' /> : null}
                  {member.championId <= 0 && member.championPickIntent && member.championPickIntent > 0 ? (
                    <div className={membersStyles.championIntent}>
                      <ChampionIdentity championId={member.championPickIntent} size='sm' />
                    </div>
                  ) : null}
                  {member.championId <= 0 && (!member.championPickIntent || member.championPickIntent <= 0) ? (
                    <div className='text-muted flex h-8 items-center text-xs'>{championLabel}:</div>
                  ) : null}
                </div>
              </div>
              <div className='ml-auto flex items-center gap-2'>
                <button
                  type='button'
                  disabled
                  className={membersStyles.swapRoleButton}
                  aria-label={`Swap Role with ${memberLabel(member)}`}
                >
                  <RotateCw className='size-4' />
                  <span className='hidden sm:inline'>Swap Role</span>
                </button>
                <button
                  type='button'
                  disabled
                  className={membersStyles.swapPickButton}
                  aria-label={`Swap Pick with ${memberLabel(member)}`}
                >
                  <ArrowLeftRight className='size-4' />
                  <span className='hidden sm:inline'>Swap Pick</span>
                </button>
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
