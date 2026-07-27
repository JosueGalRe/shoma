import { useTranslation } from 'react-i18next'

import { Badge, BottomSheet } from '@/components/ui'
import { uiStoreSelectors, useUiStore } from '@/core/state/ui-store'
import { useLobby } from '@/features/lobby'

export function LobbyBottomSheets() {
  const { t } = useTranslation()
  const { viewModel } = useLobby()
  const isLobbyInviteSheetOpen = useUiStore(uiStoreSelectors.isLobbyInviteSheetOpen)
  const setLobbyInviteSheetOpen = useUiStore(uiStoreSelectors.setLobbyInviteSheetOpen)

  return (
    <>
      <BottomSheet
        isOpen={isLobbyInviteSheetOpen}
        onClose={() => {
          return setLobbyInviteSheetOpen(false)
        }}
        title={t('invites.title')}
      >
        <div className="space-y-4">
          {viewModel.invites.length > 0 ? (
            <div>
              <p className="text-muted mb-2 text-xs tracking-[0.15em] uppercase">{t('invites.title')}</p>

              <ul className="space-y-2">
                {viewModel.invites.map((invite) => {
                  return (
                    <li key={invite.id} className="border-border bg-secondary/40 text-foreground rounded-md border p-3 text-sm">
                      <div className="flex items-center justify-between gap-3">
                        <span className="truncate">{invite.fromSummonerName}</span>

                        {invite.state ? <Badge variant="secondary">{invite.state}</Badge> : null}
                      </div>
                    </li>
                  )
                })}
              </ul>
            </div>
          ) : null}

          {viewModel.sentInvites.length > 0 ? (
            <div>
              <p className="text-muted mb-2 text-xs tracking-[0.15em] uppercase">{t('lobby.sentInvites')}</p>

              <ul className="space-y-2">
                {viewModel.sentInvites.map((invite) => {
                  return (
                    <li key={invite.id} className="border-border bg-secondary/40 text-foreground rounded-md border p-3 text-sm">
                      <div className="flex items-center justify-between gap-3">
                        <span className="truncate">{invite.toSummonerName}</span>

                        {invite.state ? (
                          <Badge variant="secondary">{t(`lobby.inviteStatus.${invite.state.toLowerCase()}`)}</Badge>
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
