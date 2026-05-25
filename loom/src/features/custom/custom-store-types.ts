export type BotDifficulty = 'intro' | 'easy' | 'medium' | 'hard' | 'ultra'

export interface CustomGamePlayer {
  id: string
  name: string
  team: 'blue' | 'red' | 'spectator'
  isBot: boolean
  botDifficulty?: BotDifficulty
}

export interface CustomGameState {
  roomName: string
  password: string
  mapId: number
  gameMode: string
  players: CustomGamePlayer[]
  maxPlayers: number
  isSpectatorEnabled: boolean
}

export interface CustomGameActions {
  setRoomConfig: (name: string, password: string, mapId: number, gameMode: string) => void
  addPlayer: (player: CustomGamePlayer) => void
  removePlayer: (id: string) => void
  movePlayer: (id: string, team: CustomGamePlayer['team']) => void
  addBot: (difficulty: BotDifficulty, team: CustomGamePlayer['team']) => void
  toggleSpectator: () => void
  reset: () => void
}

export type CustomGameStore = CustomGameState & CustomGameActions

export type CustomGameStoreSelector<T> = (state: CustomGameStore) => T
