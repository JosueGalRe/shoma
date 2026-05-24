import type { BotDifficulty } from './custom-store-types';
import type { CustomGamePlayer } from './custom-store-types';
import type { CustomGameState } from './custom-store-types';

export const botDifficulties: BotDifficulty[] = ['intro', 'easy', 'medium', 'hard', 'ultra']

export const customGameMaps = [
  { id: 11, name: "Summoner's Rift" },
  { id: 12, name: 'Howling Abyss' },
  { id: 30, name: 'Arena' },
] satisfies readonly { id: number; name: string }[]

export function selectCustomRoomName(state: CustomGameState): string {
  return state.roomName
}

export function selectCustomPassword(state: CustomGameState): string {
  return state.password
}

export function selectCustomMapId(state: CustomGameState): number {
  return state.mapId
}

export function selectCustomGameMode(state: CustomGameState): string {
  return state.gameMode
}

export function selectCustomPlayers(state: CustomGameState): CustomGamePlayer[] {
  return state.players
}

export function selectCustomMaxPlayers(state: CustomGameState): number {
  return state.maxPlayers
}

export function selectCustomIsSpectatorEnabled(state: CustomGameState): boolean {
  return state.isSpectatorEnabled
}

export function selectCustomPlayerCount(state: CustomGameState): number {
  return state.players.length
}

export function selectCustomNonSpectatorPlayerCount(state: CustomGameState): number {
  return state.players.filter((player) => { return player.team !== 'spectator'; }).length
}

export function selectCustomBotCount(state: CustomGameState): number {
  return state.players.filter((player) => { return player.isBot; }).length
}

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
