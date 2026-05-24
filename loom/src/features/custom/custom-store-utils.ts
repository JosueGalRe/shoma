import type { BotDifficulty, CustomGamePlayer, CustomGameState, CustomGameStoreSelector } from './custom-store-types'

export const botDifficulties: BotDifficulty[] = ['intro', 'easy', 'medium', 'hard', 'ultra']

export const customGameMaps = [
  { id: 11, name: "Summoner's Rift" },
  { id: 12, name: 'Howling Abyss' },
  { id: 30, name: 'Arena' },
] satisfies readonly { id: number; name: string }[]

export const selectCustomRoomName: CustomGameStoreSelector<string> = (state) => state.roomName

export const selectCustomPassword: CustomGameStoreSelector<string> = (state) => state.password

export const selectCustomMapId: CustomGameStoreSelector<number> = (state) => state.mapId

export const selectCustomGameMode: CustomGameStoreSelector<string> = (state) => state.gameMode

export const selectCustomPlayers: CustomGameStoreSelector<CustomGamePlayer[]> = (state) => state.players

export const selectCustomMaxPlayers: CustomGameStoreSelector<number> = (state) => state.maxPlayers

export const selectCustomIsSpectatorEnabled: CustomGameStoreSelector<boolean> = (state) => state.isSpectatorEnabled

export const selectCustomPlayerCount: CustomGameStoreSelector<number> = (state) => state.players.length

export const selectCustomNonSpectatorPlayerCount: CustomGameStoreSelector<number> = (state) =>
  state.players.filter((player) => player.team !== 'spectator').length

export const selectCustomBotCount: CustomGameStoreSelector<number> = (state) =>
  state.players.filter((player) => player.isBot).length

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

export function createBotId(): string {
  botCounter += 1
  return `bot-${botCounter}`
}

export function resetBotCounter(): void {
  botCounter = 0
}
