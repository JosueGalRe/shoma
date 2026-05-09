import { InviteOverlay } from '@/features/lobby'
import { uiStoreSelectors, useUiStore } from '@/core/state/ui-store'

interface LobbyInviteOverlayProps {
  permissions: {
    canInvite: boolean
    isActionPending: boolean
    isConnected: boolean
  }
  onInvitePlayer: (summonerName: string) => Promise<void>
}

export function LobbyInviteOverlay({
  permissions,
  onInvitePlayer,
}: LobbyInviteOverlayProps) {
  const isLobbyInviteOverlayOpen = useUiStore(uiStoreSelectors.isLobbyInviteOverlayOpen)
  const setLobbyInviteOverlayOpen = useUiStore(uiStoreSelectors.setLobbyInviteOverlayOpen)

  if (!isLobbyInviteOverlayOpen) return null

  const { canInvite, isActionPending, isConnected } = permissions

  return (
    <InviteOverlay
      canInvite={canInvite}
      isActionPending={isActionPending}
      isConnected={isConnected}
      onClose={() => setLobbyInviteOverlayOpen(false)}
      onInvite={onInvitePlayer}
    />
  )
}
