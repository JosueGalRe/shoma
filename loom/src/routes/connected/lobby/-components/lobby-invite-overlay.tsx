import { uiStoreSelectors, useUiStore } from '@/core/state/ui-store'
import { InviteOverlay, useLobby } from '@/features/lobby'

export function LobbyInviteOverlay() {
  const { actions, isActionPending, isConnected, viewModel } = useLobby()
  const isLobbyInviteOverlayOpen = useUiStore(uiStoreSelectors.isLobbyInviteOverlayOpen)
  const setLobbyInviteOverlayOpen = useUiStore(uiStoreSelectors.setLobbyInviteOverlayOpen)
  const handleClose = () => {
    setLobbyInviteOverlayOpen(false)
  }
  const handleInvitePlayer = actions.invitePlayer

  if (!isLobbyInviteOverlayOpen) {
    return null
  }

  return (
    <InviteOverlay
      canInvite={viewModel.canInvite}
      isActionPending={isActionPending}
      isConnected={isConnected}
      onClose={handleClose}
      onInvite={handleInvitePlayer}
    />
  )
}
