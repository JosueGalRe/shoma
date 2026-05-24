export type CustomRoomConfig = {
  roomName: string
  password: string
  mapId: number
  gameMode: string
}

export type CustomRoomConfigCardProps = {
  roomName: string
  password: string
  mapId: number
  gameMode: string
  isSpectatorEnabled: boolean
  updateRoomConfig: (nextConfig: Partial<CustomRoomConfig>) => void
  toggleSpectator: () => void
}
