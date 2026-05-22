import { TrendingUp } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Avatar, Badge, Button } from '@/components/ui'

import type { LobbyMember as LobbyMemberType } from '../lobby-store'

// @knip
export type LobbyMemberProps = {
  member: LobbyMemberType
  onKick: (member: LobbyMemberType) => Promise<void>
  onPromote: (member: LobbyMemberType) => Promise<void>
} & ({ variant: 'readonly'; showRoles: boolean } | { variant: 'manageable'; showRoles: boolean })

// @knip
export function LobbyMember({ member, onKick, onPromote, showRoles, variant }: LobbyMemberProps) {
  const { t } = useTranslation()
  const canManage = variant === 'manageable' && !member.isLocalMember
  const primaryRole = t(`lobby.roles.${member.firstPositionPreference.toLowerCase()}`)
  const secondaryRole = t(`lobby.roles.${member.secondPositionPreference.toLowerCase()}`)

  return (
    <li className='border-border bg-secondary/40 flex items-center gap-3 rounded-md border p-3'>
      <div className='relative'>
        <Avatar alt={member.displayName} src={member.iconUrl ?? undefined} size='md' />
        {member.showClimbIndicator ? (
          <div className='bg-secondary absolute -right-1 -bottom-1 rounded-full p-0.5'>
            <TrendingUp className='text-primary size-4 motion-safe:animate-pulse' />
          </div>
        ) : null}
      </div>
      <div className='min-w-0 flex-1 space-y-2'>
        <div className='flex items-start justify-between gap-3'>
          <div className='min-w-0'>
            <p className='text-foreground truncate font-medium'>
              {member.displayName} {member.isLocalMember ? `(${t('lobby.you')})` : ''}
            </p>
            <p className='text-muted text-xs'>{member.isLeader ? t('lobby.owner') : t('lobby.member')}</p>
          </div>
          <div className='flex shrink-0 items-center gap-2'>
            {member.isLocalMember ? <Badge variant='outline'>You</Badge> : null}
            {member.isLeader ? <Badge variant='secondary'>Owner</Badge> : null}
          </div>
        </div>

        {showRoles ? (
          <div className='flex flex-wrap gap-2'>
            <Badge variant='secondary'>{primaryRole}</Badge>
            <Badge variant='secondary'>{secondaryRole}</Badge>
          </div>
        ) : null}
      </div>

      <div className='flex shrink-0 gap-2'>
        <Button disabled={!canManage} onClick={() => onPromote(member)} size='sm' variant='secondary'>
          {t('lobby.promote')}
        </Button>
        <Button disabled={!canManage} onClick={() => onKick(member)} size='sm' variant='destructive'>
          {t('lobby.kick')}
        </Button>
      </div>
    </li>
  )
}
