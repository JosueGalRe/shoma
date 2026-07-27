import { uiStoreSelectors, useUiStore } from '@/core/state/ui-store'
import { InviteOverlay, useLobby } from '@/features/lobby'

export function LobbyInviteOverlay() {
  const { actions, isActionPending, isConnected, viewModel } = useLobby()
  const isLobbyInviteOverlayOpen = useUiStore(uiStoreSelectors.isLobbyInviteOverlayOpen)
  const setLobbyInviteOverlayOpen = useUiStore(uiStoreSelectors.setLobbyInviteOverlayOpen)
  const handleInvitePlayers = actions.invitePlayersById
  const handleClose = () => {
    setLobbyInviteOverlayOpen(false)
  }
  const excludeSummonerIds = new Set(
    viewModel.members.map((member) => {
      return Number(member.summonerId)
    }),
  )

  if (!isLobbyInviteOverlayOpen) {
    return null
  }

  return (
    <InviteOverlay
      canInvite={viewModel.canInvite}
      excludeSummonerIds={excludeSummonerIds}
      isActionPending={isActionPending}
      isConnected={isConnected}
      onClose={handleClose}
      onInvitePlayers={handleInvitePlayers}
    />
  )
}
