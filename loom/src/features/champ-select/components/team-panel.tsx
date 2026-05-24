import { ArrowLeftRight, RotateCw, Shield } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ROLE_ICONS } from '@/features/lobby/constants/role-icons'
import type { LobbyRole } from '@/features/lobby/lobby-store'

import { type ChampSelectMember } from '../champ-select-store'
import { ChampionIdentity } from './champion-identity'
import { membersStyles } from './members-styles'
import type { TeamPanelProps } from './members-types'

function memberLabel(member: ChampSelectMember): string {
  return member.displayName ?? `#${member.cellId}`
}

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
        {members.map((member) => (
          <div className={membersStyles.memberCard} key={member.cellId}>
            {member.assignedPosition &&
            member.assignedPosition.toUpperCase() !== 'UNSELECTED' &&
            member.assignedPosition !== '' ? (
              <div className='flex size-8 shrink-0 items-center justify-center'>
                <img
                  alt={member.assignedPosition}
                  className='size-6'
                  src={ROLE_ICONS[member.assignedPosition.toUpperCase() as LobbyRole]}
                />
              </div>
            ) : (
              <div className='size-8 shrink-0' />
            )}
            <div className='min-w-0 flex-1'>
              <div className='mb-1 flex items-center gap-2'>
                <div className={membersStyles.memberName}>
                  {memberLabel(member)}
                </div>
                {member.championPickIntent && member.championPickIntent > 0 ? (
                  <Shield className='text-primary size-4 shrink-0' />
                ) : null}
              </div>
              <div className='mt-1'>
                {member.championId > 0 ? (
                  <ChampionIdentity championId={member.championId} size='sm' />
                ) : member.championPickIntent && member.championPickIntent > 0 ? (
                  <div className={membersStyles.championIntent}>
                    <ChampionIdentity championId={member.championPickIntent} size='sm' />
                  </div>
                ) : (
                  <div className='text-muted flex h-8 items-center text-xs'>{championLabel}:</div>
                )}
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
        ))}
      </CardContent>
    </Card>
  )
}
