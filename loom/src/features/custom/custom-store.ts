import { create } from 'zustand'

import { createBotId, initialCustomGameState, resetBotCounter } from './custom-store-utils'
import type { CustomGameStore } from './custom-store-types'

export type {
  BotDifficulty,
  CustomGameActions,
  CustomGamePlayer,
  CustomGameState,
  CustomGameStore,
} from './custom-store-types'

export {
  botDifficulties,
  customGameMaps,
  initialCustomGameState,
  selectCustomBotCount,
  selectCustomGameMode,
  selectCustomIsSpectatorEnabled,
  selectCustomMapId,
  selectCustomMaxPlayers,
  selectCustomNonSpectatorPlayerCount,
  selectCustomPassword,
  selectCustomPlayerCount,
  selectCustomPlayers,
  selectCustomRoomName,
} from './custom-store-utils'

export const useCustomGameStore = create<CustomGameStore>()((set) => {return {
  ...initialCustomGameState,
  setRoomConfig(name, password, mapId, gameMode) {
    set({ roomName: name, password, mapId, gameMode })
  },
  addPlayer(player) {
    set((state) => {
      const existingPlayer = state.players.find((candidate) => {
        return candidate.id === player.id
      })
      if (existingPlayer) {
        return {
          players: state.players.map((candidate) => {
            return candidate.id === player.id ? player : candidate
          }),
        }
      }

      if (
        state.players.filter((candidate) => {
          return candidate.team !== 'spectator'
        }).length >= state.maxPlayers &&
        player.team !== 'spectator'
      ) {
        return state
      }

      return { players: [...state.players, player] }
    })
  },
  removePlayer(id) {
    set((state) => {
      return {
        players: state.players.filter((player) => {
          return player.id !== id
        }),
      }
    })
  },
  movePlayer(id, team) {
    set((state) => {
      return {
        players: state.players.map((player) => {
          return player.id === id ? { ...player, team } : player
        }),
      }
    })
  },
  addBot(difficulty, team) {
    set((state) => {
      if (
        state.players.filter((player) => {
          return player.team !== 'spectator'
        }).length >= state.maxPlayers &&
        team !== 'spectator'
      ) {
        return state
      }

      const botNumber = state.players.filter((player) => {
        return player.isBot
      }).length + 1
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
    set((state) => {
      return { isSpectatorEnabled: !state.isSpectatorEnabled }
    })
  },
  reset() {
    resetBotCounter()
    set({ ...initialCustomGameState })
  },
}})
