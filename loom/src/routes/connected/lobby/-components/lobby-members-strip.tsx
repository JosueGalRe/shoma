import { useTranslation } from 'react-i18next'

import { Avatar, Button } from '@/components/ui'
import type { LobbyMembersStripProps } from './lobby-members-strip-types'
import { lobbyMembersStripStyles } from './lobby-members-strip-styles'

export function LobbyMembersStrip({ members, modeRules, sessionState, onPromotePlayer, onKickPlayer }: LobbyMembersStripProps) {
  const { isOwner, isLoading, isConnected, isActionPending } = sessionState
  const { t } = useTranslation()
  const styles = lobbyMembersStripStyles()

  return (
    <section className={styles.strip()}>
      <div className='mb-1.5 flex items-center justify-between'>
        <p className='text-muted text-[10px] tracking-[0.2em] uppercase'>
          {t('lobby.members')}
          {isOwner ? ` • ${t('lobby.youAreOwner')}` : ''}
        </p>
        <span className='text-muted text-[10px]'>{members.length}</span>
      </div>

      {isLoading && members.length === 0 ? (
        <p className='text-muted text-xs'>{t('lobby.loading')}</p>
        ) : members.length === 0 && !isLoading ? (
          <p className='text-muted text-xs'>{t('lobby.noMembers')}</p>
        ) : (
          <ul className='flex snap-x gap-2 overflow-x-auto pb-1' aria-label={t('lobby.members')}>
            {members.map((member) => (
              <li
                key={member.summonerId}
                className={styles.memberCard()}
                aria-label={`${t('lobby.member')}: ${member.displayName}, ${member.isLeader ? t('lobby.owner') : t('lobby.member')}`}
              >
              <Avatar alt={member.displayName} src={member.iconUrl ?? undefined} size='sm' />
              <span className='text-foreground w-full truncate text-center text-[10px]'>{member.displayName}</span>
              {modeRules.requiresRoleSelection &&
              (member.firstPositionPreference !== 'UNSELECTED' || member.secondPositionPreference !== 'UNSELECTED') ? (
                <div className='flex gap-0.5'>
                  {member.firstPositionPreference !== 'UNSELECTED' ? (
                    <span className='text-muted text-[9px]'>
                      {t(`lobby.roles.${member.firstPositionPreference.toLowerCase()}`)}
                    </span>
                  ) : null}
                </div>
              ) : null}
              {isOwner && !member.isLocalMember ? (
                <div className='mt-1 flex w-full flex-col gap-1'>
                  <Button
                    disabled={!isConnected || isActionPending}
                    onClick={() => void onPromotePlayer(member)}
                    size='sm'
                    variant='secondary'
                    className='h-8 min-h-[44px] px-1 text-[10px]'
                  >
                    {t('lobby.promote')}
                  </Button>
                  <Button
                    disabled={!isConnected || isActionPending}
                    onClick={() => void onKickPlayer(member)}
                    size='sm'
                    variant='destructive'
                    className='h-8 min-h-[44px] px-1 text-[10px]'
                  >
                    {t('lobby.kick')}
                  </Button>
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
