import { create } from 'zustand'

export type BotDifficulty = 'intro' | 'easy' | 'medium' | 'hard' | 'ultra'

export type CustomGamePlayer = {
  id: string
  name: string
  team: 'blue' | 'red' | 'spectator'
  isBot: boolean
  botDifficulty?: BotDifficulty
}

// @knip
export type CustomGameState = {
  roomName: string
  password: string
  mapId: number
  gameMode: string
  players: CustomGamePlayer[]
  maxPlayers: number
  isSpectatorEnabled: boolean
}

// @knip
export type CustomGameActions = {
  setRoomConfig: (name: string, password: string, mapId: number, gameMode: string) => void
  addPlayer: (player: CustomGamePlayer) => void
  removePlayer: (id: string) => void
  movePlayer: (id: string, team: CustomGamePlayer['team']) => void
  addBot: (difficulty: BotDifficulty, team: CustomGamePlayer['team']) => void
  toggleSpectator: () => void
  reset: () => void
}

export type CustomGameStore = CustomGameState & CustomGameActions

export const botDifficulties: BotDifficulty[] = ['intro', 'easy', 'medium', 'hard', 'ultra']

export const customGameMaps = [
  { id: 11, name: "Summoner's Rift" },
  { id: 12, name: 'Howling Abyss' },
  { id: 30, name: 'Arena' },
] as const

// @knip
export const initialCustomGameState: CustomGameState = {
  roomName: '',
  password: '',
  mapId: 11,
  gameMode: 'custom',
  players: [],
  maxPlayers: 10,
  isSpectatorEnabled: true,
}

let botCounter = 0

function createBotId(): string {
  botCounter += 1
  return `bot-${botCounter}`
}

export const useCustomGameStore = create<CustomGameStore>()((set) => ({
  ...initialCustomGameState,
  setRoomConfig(name, password, mapId, gameMode) {
    set({ roomName: name, password, mapId, gameMode })
  },
  addPlayer(player) {
    set((state) => {
      const existingPlayer = state.players.find((candidate) => candidate.id === player.id)
      if (existingPlayer) {
        return {
          players: state.players.map((candidate) => (candidate.id === player.id ? player : candidate)),
        }
      }

      if (state.players.filter((candidate) => candidate.team !== 'spectator').length >= state.maxPlayers && player.team !== 'spectator') {
        return state
      }

      return { players: [...state.players, player] }
    })
  },
  removePlayer(id) {
    set((state) => ({ players: state.players.filter((player) => player.id !== id) }))
  },
  movePlayer(id, team) {
    set((state) => ({
      players: state.players.map((player) => (player.id === id ? { ...player, team } : player)),
    }))
  },
  addBot(difficulty, team) {
    set((state) => {
      if (state.players.filter((player) => player.team !== 'spectator').length >= state.maxPlayers && team !== 'spectator') {
        return state
      }

      const botNumber = state.players.filter((player) => player.isBot).length + 1
      return {
        players: [
          ...state.players,
          {
            id: createBotId(),
            name: `Bot ${botNumber}`,
            team,
            isBot: true,
            botDifficulty: difficulty,
          },
        ],
      }
    })
  },
  toggleSpectator() {
    set((state) => ({ isSpectatorEnabled: !state.isSpectatorEnabled }))
  },
  reset() {
    botCounter = 0
    set({ ...initialCustomGameState })
  },
}))
