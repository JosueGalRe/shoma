export interface LobbyVisibilityToggleProps {
  partyType: string | null
  isOwner: boolean
  isLoading: boolean
  disabled?: boolean
  onToggle: (partyType: string) => void
}
