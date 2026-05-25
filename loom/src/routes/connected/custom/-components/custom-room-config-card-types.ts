export interface CustomRoomConfig {
  roomName: string
  password: string
  mapId: number
  gameMode: string
}

export interface CustomRoomConfigCardProps {
  roomName: string
  password: string
  mapId: number
  gameMode: string
  isSpectatorEnabled: boolean
  updateRoomConfig: (nextConfig: Partial<CustomRoomConfig>) => void
  toggleSpectator: () => void
}
