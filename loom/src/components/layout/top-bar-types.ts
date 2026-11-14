export interface TopBarProps {
  // Greys out the back arrow, as the lobby does while searching
  backDisabled?: boolean
  // Without it the bar shows the logo, as on the dashboard
  onBack?: () => void
}
