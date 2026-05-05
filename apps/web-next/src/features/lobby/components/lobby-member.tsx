import { useTranslation } from 'react-i18next'

import { Avatar, Badge, Button } from '@/components/ui'

import type { LobbyMember as LobbyMemberType } from '../lobby-store'

export type LobbyMemberProps = {
  isActionPending: boolean
  isConnected: boolean
  isOwner: boolean
  member: LobbyMemberType
  onKick: (member: LobbyMemberType) => Promise<void>
  onPromote: (member: LobbyMemberType) => Promise<void>
  showRoles: boolean
}

export function LobbyMember({ isActionPending, isConnected, isOwner, member, onKick, onPromote, showRoles }: LobbyMemberProps) {
  const { t } = useTranslation()
  const canManage = isConnected && isOwner && !member.isLocalMember && !isActionPending
  const primaryRole = t(`lobby.roles.${member.firstPositionPreference.toLowerCase()}`)
  const secondaryRole = t(`lobby.roles.${member.secondPositionPreference.toLowerCase()}`)

  return (
    <li className="flex items-center gap-3 rounded-md border border-lol-border-subtle bg-lol-navy-900/40 p-3">
      <Avatar alt={member.displayName} src={member.iconUrl ?? undefined} size="md" />
      <div className="min-w-0 flex-1 space-y-2">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate font-medium text-lol-text-primary">
              {member.displayName} {member.isLocalMember ? `(${t('lobby.you')})` : ''}
            </p>
            <p className="text-xs text-lol-text-muted">{member.isLeader ? t('lobby.owner') : t('lobby.member')}</p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {member.isLocalMember ? <Badge variant="outline">You</Badge> : null}
            {member.isLeader ? <Badge variant="secondary">Owner</Badge> : null}
          </div>
        </div>

        {showRoles ? (
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">{primaryRole}</Badge>
            <Badge variant="secondary">{secondaryRole}</Badge>
          </div>
        ) : null}
      </div>

      <div className="flex shrink-0 gap-2">
        <Button disabled={!canManage} onClick={() => onPromote(member)} size="sm" variant="secondary">
          {t('lobby.promote')}
        </Button>
        <Button disabled={!canManage} onClick={() => onKick(member)} size="sm" variant="destructive">
          {t('lobby.kick')}
        </Button>
      </div>
    </li>
  )
}
