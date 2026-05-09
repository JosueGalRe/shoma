import { useTranslation } from 'react-i18next'
import { Badge, BottomSheet } from '@/components/ui'
import { uiStoreSelectors, useUiStore } from '@/core/state/ui-store'
import { RolePicker, useLobby } from '@/features/lobby'
import { getModeRules } from '@/features/modes/mode-engine'
import type { LobbyRole } from '@/features/lobby/lobby-store'

export function LobbyBottomSheets() {
  const { t } = useTranslation()
  const {
    actions,
    invites,
    isActionPending,
    isConnected,
    mode,
    rolePreferences,
    sentInvites,
  } = useLobby()
  const isLobbyRoleSheetOpen = useUiStore(uiStoreSelectors.isLobbyRoleSheetOpen)
  const setLobbyRoleSheetOpen = useUiStore(uiStoreSelectors.setLobbyRoleSheetOpen)
  const isLobbyInviteSheetOpen = useUiStore(uiStoreSelectors.isLobbyInviteSheetOpen)
  const setLobbyInviteSheetOpen = useUiStore(uiStoreSelectors.setLobbyInviteSheetOpen)
  const modeRules = getModeRules(mode)

  return (
    <>
      <BottomSheet
        isOpen={isLobbyRoleSheetOpen}
        onClose={() => setLobbyRoleSheetOpen(false)}
        title={t('lobby.rolePreferences')}
      >
        {modeRules.requiresRoleSelection ? (
          <div className="grid gap-3">
              <RolePicker
                disabled={!isConnected || isActionPending}
                label={t('lobby.primaryRole')}
                onChange={(role) => actions.changeRole('first', role as LobbyRole)}
                value={rolePreferences.first}
              />
              <RolePicker
                disabled={!isConnected || isActionPending}
                label={t('lobby.secondaryRole')}
                onChange={(role) => actions.changeRole('second', role as LobbyRole)}
                value={rolePreferences.second}
              />
          </div>
        ) : (
          <p className="text-sm text-lol-text-muted">{t('lobby.rolePreferences')} {t('queue.notInQueue')}</p>
        )}
      </BottomSheet>

      <BottomSheet
        isOpen={isLobbyInviteSheetOpen}
        onClose={() => setLobbyInviteSheetOpen(false)}
        title={t('invites.title')}
      >
        <div className="space-y-4">
          {invites.length > 0 ? (
            <div>
              <p className="text-xs uppercase tracking-[0.15em] text-lol-text-secondary mb-2">{t('invites.title')}</p>
              <ul className="space-y-2">
                {invites.map((invite) => (
                  <li key={invite.id} className="rounded-md border border-lol-border-subtle bg-lol-navy-900/40 p-3 text-sm text-lol-text-primary">
                    <div className="flex items-center justify-between gap-3">
                      <span className="truncate">{invite.fromSummonerName}</span>
                      {invite.state ? <Badge variant="secondary">{invite.state}</Badge> : null}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {sentInvites.length > 0 ? (
            <div>
              <p className="text-xs uppercase tracking-[0.15em] text-lol-text-secondary mb-2">{t('lobby.sentInvites')}</p>
              <ul className="space-y-2">
                {sentInvites.map((invite) => (
                  <li key={invite.id} className="rounded-md border border-lol-border-subtle bg-lol-navy-900/40 p-3 text-sm text-lol-text-primary">
                    <div className="flex items-center justify-between gap-3">
                      <span className="truncate">{invite.toSummonerName}</span>
                      {invite.state ? <Badge variant="secondary">{t(`lobby.inviteStatus.${invite.state.toLowerCase()}`)}</Badge> : null}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      </BottomSheet>
    </>
  )
}
