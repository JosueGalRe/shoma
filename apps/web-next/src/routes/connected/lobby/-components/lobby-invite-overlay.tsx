import { InviteOverlay, useLobby } from '@/features/lobby'
import { uiStoreSelectors, useUiStore } from '@/core/state/ui-store'

export function LobbyInviteOverlay() {
  const { actions, canInvite, isActionPending, isConnected } = useLobby()
  const isLobbyInviteOverlayOpen = useUiStore(uiStoreSelectors.isLobbyInviteOverlayOpen)
  const setLobbyInviteOverlayOpen = useUiStore(uiStoreSelectors.setLobbyInviteOverlayOpen)

  if (!isLobbyInviteOverlayOpen) return null

  return (
    <InviteOverlay
      canInvite={canInvite}
      isActionPending={isActionPending}
      isConnected={isConnected}
      onClose={() => setLobbyInviteOverlayOpen(false)}
      onInvite={actions.invitePlayer}
    />
  )
}
