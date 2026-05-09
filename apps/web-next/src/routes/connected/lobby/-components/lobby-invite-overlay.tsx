import { InviteOverlay } from '@/features/lobby'

interface LobbyInviteOverlayProps {
  isInviteOverlayOpen: boolean
  setIsInviteOverlayOpen: (open: boolean) => void
  permissions: {
    canInvite: boolean
    isActionPending: boolean
    isConnected: boolean
  }
  onInvitePlayer: (summonerName: string) => Promise<void>
}

export function LobbyInviteOverlay({
  isInviteOverlayOpen,
  setIsInviteOverlayOpen,
  permissions,
  onInvitePlayer,
}: LobbyInviteOverlayProps) {
  if (!isInviteOverlayOpen) return null

  const { canInvite, isActionPending, isConnected } = permissions

  return (
    <InviteOverlay
      canInvite={canInvite}
      isActionPending={isActionPending}
      isConnected={isConnected}
      onClose={() => setIsInviteOverlayOpen(false)}
      onInvite={onInvitePlayer}
    />
  )
}
