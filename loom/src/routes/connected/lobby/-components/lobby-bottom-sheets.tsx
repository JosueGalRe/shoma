import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'

import { Badge, BottomSheet } from '@/components/ui'
import { uiStoreSelectors, useUiStore } from '@/core/state/ui-store'
import { RolePicker, useLobby } from '@/features/lobby'
import type { LobbyRole } from '@/features/lobby/lobby-store'
import { computeRolePreferences } from '@/features/lobby/utils/compute-role-preferences'
import { getModeRules } from '@/features/modes/mode-engine'

export function LobbyBottomSheets() {
  const { t } = useTranslation()
  const { actions, isActionPending, isConnected, viewModel } = useLobby()
  const isLobbyRoleSheetOpen = useUiStore(uiStoreSelectors.isLobbyRoleSheetOpen)
  const setLobbyRoleSheetOpen = useUiStore(uiStoreSelectors.setLobbyRoleSheetOpen)
  const isLobbyInviteSheetOpen = useUiStore(uiStoreSelectors.isLobbyInviteSheetOpen)
  const setLobbyInviteSheetOpen = useUiStore(uiStoreSelectors.setLobbyInviteSheetOpen)
  const modeRules = getModeRules(viewModel.mode)
  const handleSelect = useCallback(
    async (slot: 'first' | 'second', role: LobbyRole) => {
      const next = computeRolePreferences(viewModel.rolePreferences, slot, role)
      if (next.first !== viewModel.rolePreferences.first || next.second !== viewModel.rolePreferences.second) {
        await actions.setRolePreferences(next)
      }
    },
    [actions, viewModel.rolePreferences],
  )

  return (
    <>
      <BottomSheet
        isOpen={isLobbyRoleSheetOpen}
        onClose={() => {
          return setLobbyRoleSheetOpen(false)
        }}
        title={t('lobby.rolePreferences')}
      >
        {modeRules.requiresRoleSelection ? (
          <div className='grid gap-3'>
            <RolePicker
              disabled={!isConnected || isActionPending}
              label={t('lobby.primaryRole')}
              onChange={(role) => {
                return handleSelect('first', role)
              }}
              value={viewModel.rolePreferences.first}
            />
            {viewModel.rolePreferences.first !== 'FILL' && (
              <RolePicker
                disabled={!isConnected || isActionPending}
                label={t('lobby.secondaryRole')}
                onChange={(role) => {
                  return handleSelect('second', role)
                }}
                value={viewModel.rolePreferences.second}
              />
            )}
          </div>
        ) : (
          <p className='text-muted text-sm'>
            {t('lobby.rolePreferences')} {t('queue.notInQueue')}
          </p>
        )}
      </BottomSheet>

      <BottomSheet
        isOpen={isLobbyInviteSheetOpen}
        onClose={() => {
          return setLobbyInviteSheetOpen(false)
        }}
        title={t('invites.title')}
      >
        <div className='space-y-4'>
          {viewModel.invites.length > 0 ? (
            <div>
              <p className='text-muted mb-2 text-xs tracking-[0.15em] uppercase'>{t('invites.title')}</p>
              <ul className='space-y-2'>
                {viewModel.invites.map((invite) => {
                  return (
                    <li key={invite.id} className='border-border bg-secondary/40 text-foreground rounded-md border p-3 text-sm'>
                      <div className='flex items-center justify-between gap-3'>
                        <span className='truncate'>{invite.fromSummonerName}</span>
                        {invite.state ? <Badge variant='secondary'>{invite.state}</Badge> : null}
                      </div>
                    </li>
                  )
                })}
              </ul>
            </div>
          ) : null}

          {viewModel.sentInvites.length > 0 ? (
            <div>
              <p className='text-muted mb-2 text-xs tracking-[0.15em] uppercase'>{t('lobby.sentInvites')}</p>
              <ul className='space-y-2'>
                {viewModel.sentInvites.map((invite) => {
                  return (
                    <li key={invite.id} className='border-border bg-secondary/40 text-foreground rounded-md border p-3 text-sm'>
                      <div className='flex items-center justify-between gap-3'>
                        <span className='truncate'>{invite.toSummonerName}</span>
                        {invite.state ? (
                          <Badge variant='secondary'>{t(`lobby.inviteStatus.${invite.state.toLowerCase()}`)}</Badge>
                        ) : null}
                      </div>
                    </li>
                  )
                })}
              </ul>
            </div>
          ) : null}
        </div>
      </BottomSheet>
    </>
  )
}
