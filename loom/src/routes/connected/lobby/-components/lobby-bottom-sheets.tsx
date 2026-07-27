import { useTranslation } from 'react-i18next'

import { Badge, BottomSheet, Button } from '@/components/ui'
import { uiStoreSelectors, useUiStore } from '@/core/state/ui-store'
import { useInvites } from '@/features/invites'
import { useLobby } from '@/features/lobby'

import { lobbyBottomSheetsStyles } from './lobby-bottom-sheets-styles'

export function LobbyBottomSheets() {
  const { t } = useTranslation()
  const { viewModel } = useLobby()
  const { acceptInvite, declineInvite } = useInvites()
  const styles = lobbyBottomSheetsStyles()
  const isLobbyInviteSheetOpen = useUiStore(uiStoreSelectors.isLobbyInviteSheetOpen)
  const setLobbyInviteSheetOpen = useUiStore(uiStoreSelectors.setLobbyInviteSheetOpen)
  const hasAnyInvite = viewModel.invites.length > 0 || viewModel.sentInvites.length > 0

  return (
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
            <p className={styles.sectionLabel()}>{t('invites.title')}</p>

            <ul className="space-y-2">
              {viewModel.invites.map((invite) => {
                return (
                  <li key={invite.id} className={styles.inviteItem()}>
                    <span className={styles.inviteName()}>{invite.fromSummonerName}</span>

                    {invite.state === 'Pending' ? (
                      <div className={styles.inviteActions()}>
                        <Button
                          onClick={() => {
                            void acceptInvite(invite.id)
                          }}
                          size="sm"
                          variant="primary"
                        >
                          {t('invites.accept')}
                        </Button>

                        <Button
                          onClick={() => {
                            void declineInvite(invite.id)
                          }}
                          size="sm"
                          variant="secondary"
                        >
                          {t('invites.decline')}
                        </Button>
                      </div>
                    ) : null}

                    {invite.state && invite.state !== 'Pending' ? (
                      <Badge variant="secondary">{t(`lobby.inviteStatus.${invite.state.toLowerCase()}`)}</Badge>
                    ) : null}
                  </li>
                )
              })}
            </ul>
          </div>
        ) : null}

        {viewModel.sentInvites.length > 0 ? (
          <div>
            <p className={styles.sectionLabel()}>{t('lobby.sentInvites')}</p>

            <ul className="space-y-2">
              {viewModel.sentInvites.map((invite) => {
                return (
                  <li key={invite.id} className={styles.inviteItem()}>
                    <span className={styles.inviteName()}>{invite.toSummonerName}</span>

                    {invite.state ? (
                      <Badge variant="secondary">{t(`lobby.inviteStatus.${invite.state.toLowerCase()}`)}</Badge>
                    ) : null}
                  </li>
                )
              })}
            </ul>
          </div>
        ) : null}

        {!hasAnyInvite ? <p className={styles.empty()}>{t('invites.noInvites')}</p> : null}
      </div>
    </BottomSheet>
  )
}
