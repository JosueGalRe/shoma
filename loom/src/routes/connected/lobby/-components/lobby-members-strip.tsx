import { useTranslation } from 'react-i18next'
import { Avatar, Button } from '@/components/ui'
import type { LobbyMember } from '@/features/lobby/lobby-store'

interface LobbyMembersStripProps {
  members: LobbyMember[]
  modeRules: { requiresRoleSelection: boolean }
  sessionState: {
    isOwner: boolean
    isLoading: boolean
    isConnected: boolean
    isActionPending: boolean
  }
  onPromotePlayer: (member: LobbyMember) => Promise<void>
  onKickPlayer: (member: LobbyMember) => Promise<void>
}

export function LobbyMembersStrip({
  members,
  modeRules,
  sessionState,
  onPromotePlayer,
  onKickPlayer,
}: LobbyMembersStripProps) {
  const { isOwner, isLoading, isConnected, isActionPending } = sessionState
  const { t } = useTranslation()

  return (
    <section className="shrink-0 px-4 py-2">
      <div className="flex items-center justify-between mb-1.5">
        <p className="text-[10px] uppercase tracking-[0.2em] text-muted">
          {t('lobby.members')}{isOwner ? ` • ${t('lobby.youAreOwner')}` : ''}
        </p>
        <span className="text-[10px] text-muted">{members.length}</span>
      </div>
      
      {isLoading && members.length === 0 ? (
        <p className="text-xs text-muted">{t('lobby.loading')}</p>
      ) : members.length === 0 && !isLoading ? (
        <p className="text-xs text-muted">{t('lobby.noMembers')}</p>
      ) : (
        <ul
          className="flex gap-2 overflow-x-auto pb-1 snap-x"
          aria-label={t('lobby.members')}
        >
          {members.map((member) => (
            <li
              key={member.summonerId}
              className="flex shrink-0 flex-col items-center gap-1 rounded-lg border border-border bg-secondary/40 p-2 w-[72px]"
              aria-label={`${t('lobby.member')}: ${member.displayName}, ${member.isLeader ? t('lobby.owner') : t('lobby.member')}`}
            >
              <Avatar alt={member.displayName} src={member.iconUrl ?? undefined} size="sm" />
              <span className="text-[10px] text-foreground truncate w-full text-center">
                {member.displayName}
              </span>
              {modeRules.requiresRoleSelection && (member.firstPositionPreference !== 'UNSELECTED' || member.secondPositionPreference !== 'UNSELECTED') ? (
                <div className="flex gap-0.5">
                  {member.firstPositionPreference !== 'UNSELECTED' ? (
                    <span className="text-[9px] text-muted">{t(`lobby.roles.${member.firstPositionPreference.toLowerCase()}`)}</span>
                  ) : null}
                </div>
              ) : null}
              {isOwner && !member.isLocalMember ? (
                <div className="flex flex-col gap-1 w-full mt-1">
                  <Button
                    disabled={!isConnected || isActionPending}
                    onClick={() => void onPromotePlayer(member)}
                    size="sm"
                    variant="secondary"
                    className="h-8 min-h-[44px] text-[10px] px-1"
                  >
                    {t('lobby.promote')}
                  </Button>
                  <Button
                    disabled={!isConnected || isActionPending}
                    onClick={() => void onKickPlayer(member)}
                    size="sm"
                    variant="destructive"
                    className="h-8 min-h-[44px] text-[10px] px-1"
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
