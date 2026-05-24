import { TrendingUp } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Avatar, Badge, Button } from '@/components/ui'

import { lobbyMemberStyles } from './lobby-member-styles'
import type { LobbyMemberProps } from './lobby-member-types'
import { canManageLobbyMember, getLobbyMemberRoleLabel } from './lobby-member-utils'

// @knip
export function LobbyMember({ member, onKick, onPromote, showRoles, variant }: LobbyMemberProps) {
  const { t } = useTranslation()
  const styles = lobbyMemberStyles()
  const canManage = canManageLobbyMember(variant, member)
  const primaryRole = getLobbyMemberRoleLabel(t, member.firstPositionPreference)
  const secondaryRole = getLobbyMemberRoleLabel(t, member.secondPositionPreference)

  return (
    <li className={styles.item()}>
      <div className={styles.avatarWrapper()}>
        <Avatar alt={member.displayName} src={member.iconUrl ?? undefined} size='md' />
        {member.showClimbIndicator ? (
          <div className={styles.climbIndicator()}>
            <TrendingUp className='text-primary size-4 motion-safe:animate-pulse' />
          </div>
        ) : null}
      </div>
      <div className={styles.content()}>
        <div className={styles.header()}>
          <div className={styles.memberInfo()}>
            <p className={styles.name()}>
              {member.displayName} {member.isLocalMember ? `(${t('lobby.you')})` : ''}
            </p>
            <p className={styles.role()}>{member.isLeader ? t('lobby.owner') : t('lobby.member')}</p>
          </div>
          <div className={styles.badges()}>
            {member.isLocalMember ? <Badge variant='outline'>You</Badge> : null}
            {member.isLeader ? <Badge variant='secondary'>Owner</Badge> : null}
          </div>
        </div>

        {showRoles ? (
          <div className={styles.roles()}>
            <Badge variant='secondary'>{primaryRole}</Badge>
            <Badge variant='secondary'>{secondaryRole}</Badge>
          </div>
        ) : null}
      </div>

      <div className={styles.actions()}>
        <Button
          disabled={!canManage}
          onClick={() => {
            return onPromote(member)
          }}
          size='sm'
          variant='secondary'
        >
          {t('lobby.promote')}
        </Button>
        <Button
          disabled={!canManage}
          onClick={() => {
            return onKick(member)
          }}
          size='sm'
          variant='destructive'
        >
          {t('lobby.kick')}
        </Button>
      </div>
    </li>
  )
}
