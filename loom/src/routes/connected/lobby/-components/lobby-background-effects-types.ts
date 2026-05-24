import type React from 'react'

export interface LobbyBackgroundEffectsProps {
  isSearching: boolean
}

export interface CustomCSSProperties extends React.CSSProperties {
  '--start-x'?: string
  '--start-y'?: string
  '--end-x'?: string
  '--end-y'?: string
}
