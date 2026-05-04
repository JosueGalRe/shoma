import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Button, Card, CardContent, CardHeader, CardTitle, Input } from '@/components/ui'
import { lobbyRoles, useLobby, type LobbyMember, type LobbyRole } from '@/features/lobby'
import { getModeNameKey, getModeRules } from '@/features/modes/mode-engine'

function LobbyRouteComponent() {
  const { t } = useTranslation()
  const {
    actionError,
    actions,
    canInvite,
    invites,
    isActionPending,
    isConnected,
    isLoading,
    isOwner,
    members,
    mode,
    queueStatus,
    rolePreferences,
  } = useLobby()
  const [inviteName, setInviteName] = useState('')
  const modeRules = getModeRules(mode)
  const hasRequiredRoles = rolePreferences.first !== 'UNSELECTED' && rolePreferences.second !== 'UNSELECTED'
  const canJoinQueue = isConnected && !isActionPending && !queueStatus.isSearching && (!modeRules.requiresRoleSelection || hasRequiredRoles)

  const queueLabel = queueStatus.isSearching
    ? `${t('queue.searching')}${queueStatus.searchState ? ` (${queueStatus.searchState})` : ''}`
    : t('queue.notInQueue')

  async function submitInvite(event: { preventDefault: () => void }) {
    event.preventDefault()
    await actions.invitePlayer(inviteName)
    setInviteName('')
  }

  return (
    <main className="space-y-4">
      <section className="space-y-1">
        <h2 className="text-xl font-bold text-white">{t('lobby.title')}</h2>
        <p className="text-sm text-gray-400">{t('lobby.noData')}</p>
      </section>

      {!isConnected ? <p className="rounded-md border border-yellow-700 bg-yellow-950/40 p-3 text-sm text-yellow-200">{t('lobby.connecting')}</p> : null}
      {actionError ? <p className="rounded-md border border-red-700 bg-red-950/40 p-3 text-sm text-red-200">{t(actionError)}</p> : null}

      <Card>
        <CardHeader>
          <CardTitle>{t('queue.title')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-gray-300">{t('champSelect.phase')}: {queueLabel}</p>
          <p className="text-sm text-gray-400">{t('queue.type')}: {t(getModeNameKey(mode))}</p>
          {queueStatus.queueId ? <p className="text-sm text-gray-400">{t('lobby.queueId')}: {queueStatus.queueId}</p> : null}
          <div className="flex gap-2">
            <Button onClick={actions.joinQueue} disabled={!canJoinQueue} variant="primary">
              {t('queue.findMatch')}
            </Button>
            <Button onClick={actions.leaveQueue} disabled={!isConnected || isActionPending || !queueStatus.isSearching} variant="secondary">
              {t('queue.leave')}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            {t('lobby.members')}
            {isOwner ? ` (${t('lobby.youAreOwner')})` : ''}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading && members.length === 0 ? <p className="text-sm text-gray-400">{t('lobby.loading')}</p> : null}
          {members.length === 0 && !isLoading ? <p className="text-sm text-gray-400">{t('lobby.noMembers')}</p> : null}
          <ul className="space-y-3">
            {members.map((member) => (
              <MemberRow
                key={member.summonerId}
                isActionPending={isActionPending}
                isConnected={isConnected}
                isOwner={isOwner}
                member={member}
                onKick={actions.kickPlayer}
                onPromote={actions.promotePlayer}
                showRoles={modeRules.requiresRoleSelection}
              />
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('lobby.invitePlayer')}</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="flex gap-2" onSubmit={submitInvite}>
            <Input
              aria-label={t('lobby.summonerName')}
              disabled={!isConnected || isActionPending || !canInvite}
              onChange={(event) => setInviteName(event.target.value)}
              placeholder={t('lobby.summonerName')}
              value={inviteName}
            />
            <Button disabled={!isConnected || isActionPending || !canInvite} type="submit" variant="primary">
              {t('common.invite')}
            </Button>
          </form>
          {!canInvite ? <p className="mt-2 text-xs text-gray-500">{t('lobby.invitePermission')}</p> : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('invites.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          {invites.length === 0 ? <p className="text-sm text-gray-400">{t('invites.none')}</p> : null}
          <ul className="space-y-2">
            {invites.map((invite) => (
              <li key={invite.id} className="rounded-md border border-gray-800 p-3 text-sm text-gray-300">
                {invite.fromSummonerName}
                {invite.state ? <span className="text-gray-500"> - {invite.state}</span> : null}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {modeRules.requiresRoleSelection ? (
        <Card>
          <CardHeader>
            <CardTitle>{t('lobby.rolePreferences')}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            <RoleSelect
              disabled={!isConnected || isActionPending}
              label={t('lobby.primaryRole')}
              onChange={(role) => actions.changeRole('first', role)}
              value={rolePreferences.first}
            />
            <RoleSelect
              disabled={!isConnected || isActionPending}
              label={t('lobby.secondaryRole')}
              onChange={(role) => actions.changeRole('second', role)}
              value={rolePreferences.second}
            />
          </CardContent>
        </Card>
      ) : null}
    </main>
  )
}

type MemberRowProps = {
  isActionPending: boolean
  isConnected: boolean
  isOwner: boolean
  member: LobbyMember
  onKick: (member: LobbyMember) => Promise<void>
  onPromote: (member: LobbyMember) => Promise<void>
  showRoles: boolean
}

function MemberRow({ isActionPending, isConnected, isOwner, member, onKick, onPromote, showRoles }: MemberRowProps) {
  const { t } = useTranslation()
  const canManage = isConnected && isOwner && !member.isLocalMember && !isActionPending

  return (
    <li className="flex items-center gap-3 rounded-md border border-gray-800 p-3">
      {member.iconUrl ? (
        <img alt="" className="h-10 w-10 rounded-full" src={member.iconUrl} />
      ) : (
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-800 text-sm text-gray-400">?</div>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-white">
          {member.displayName} {member.isLocalMember ? `(${t('lobby.you')})` : ''}
        </p>
        <p className="text-xs text-gray-400">
          {member.isLeader ? t('lobby.owner') : t('lobby.member')}
          {showRoles ? ` - ${t(`lobby.roles.${member.firstPositionPreference.toLowerCase()}`)}/${t(`lobby.roles.${member.secondPositionPreference.toLowerCase()}`)}` : ''}
        </p>
      </div>
      <div className="flex gap-2">
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

type RoleSelectProps = {
  disabled: boolean
  label: string
  onChange: (role: LobbyRole) => Promise<void>
  value: LobbyRole
}

function RoleSelect({ disabled, label, onChange, value }: RoleSelectProps) {
  const { t } = useTranslation()

  return (
    <label className="space-y-1 text-sm text-gray-300">
      <span>{label}</span>
      <select
        className="h-10 w-full rounded-md border border-gray-700 bg-gray-950 px-3 text-sm text-white disabled:opacity-50"
        disabled={disabled}
        onChange={(event) => {
          void onChange(event.target.value as LobbyRole)
        }}
        value={value}
        >
          {lobbyRoles.map((role) => (
            <option key={role} value={role}>
              {t(`lobby.roles.${role.toLowerCase()}`)}
            </option>
          ))}
        </select>
    </label>
  )
}

export const Route = createFileRoute('/connected/lobby')({
  component: LobbyRouteComponent,
})
