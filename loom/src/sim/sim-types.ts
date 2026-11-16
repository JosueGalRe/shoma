export interface SimResponse {
  content: unknown
  status: number
}

// What the LCU would push for a path; 404 with null content when it's gone
export interface SimEvent {
  content: unknown
  path: string
  status: number
}

// A real client's answers by path, from scripts/capture-sim-data.ts
export type SimCaptures = Record<string, SimResponse>

export interface SimPerson {
  gameName: string
  iconId: number
  level: number
  puuid: string
  summonerId: number
  tagLine: string
}

export interface SimMember {
  firstPosition: string
  isLeader: boolean
  // Swift Play's party ready
  isReady: boolean
  playerSlots: unknown[]
  secondPosition: string
  summonerId: number
}

export interface SimSentInvitation {
  acceptAt: number
  state: string
  summonerId: number
}

export interface SimLobby {
  invitations: SimSentInvitation[]
  isCustom: boolean
  members: SimMember[]
  partyId: string
  partyType: string
  queueId: number
}

export interface SimReceivedInvitation {
  fromSummonerId: number
  invitationId: string
  queueId: number
  timestamp: number
}

export interface SimChatMessage {
  body: string
  fromPid: string
  id: string
  timestamp: number
}

export interface SimFriendRequest {
  gameName: string
  puuid: string
  tagLine: string
}

export interface SimChat {
  // Conversations loom opened with a friend who had none, by id (the friend's pid)
  conversations: string[]
  friendRequests: SimFriendRequest[]
  // By conversation id. One the world hasn't touched shows only the last message of its capture
  messages: Record<string, SimChatMessage[]>
  // A friend answers a moment after a message
  replies: { conversationId: string; dueAt: number }[]
  unread: Record<string, number>
}

export interface SimReadyCheck {
  acceptedAt: number | null
  poppedAt: number
  response: 'Accepted' | 'None'
}

export interface SimSearch {
  // When the match pops on its own; null waits for the panel
  popAt: number | null
  startedAt: number
}

export interface SimChampSelectCell {
  cellId: number
  championId: number
  // The hover or planned pick, until the pick locks
  intent: number
  // Kept for the other team too, which the client hides
  position: string
  skinId: number
  spell1Id: number
  spell2Id: number
  // 0 for the other team
  summonerId: number
  team: number
  wardSkinId: number
}

export interface SimChampSelectAction {
  actorCellId: number
  // When the bot playing this cell hovers and locks, set as its turn starts
  bot: { hoverAt: number; lockAt: number } | null
  championId: number
  completed: boolean
  id: number
  type: 'ban' | 'pick' | 'ten_bans_reveal'
}

export interface SimChampSelect {
  actions: SimChampSelectAction[][]
  cells: SimChampSelectCell[]
  counter: number
  // When the phase or the turn in progress runs out
  deadline: number
  gameId: number
  id: string
  localCellId: number
  phase: 'PLANNING' | 'BAN_PICK' | 'FINALIZATION' | 'GAME_STARTING'
  queueId: number
  // Swift Play: the client skips champ select and goes straight to the game
  skipped: boolean
  // When the LCU last refreshed the timer, sent as internalNowInEpochMs
  timerAt: number
  timerTotal: number
  // The actions group in progress
  turn: number
}

export interface SimGame {
  phase: 'GameStart' | 'InProgress' | 'WaitingForStats' | 'PreEndOfGame' | 'EndOfGame'
  startedAt: number
}

// Plain JSON, so it survives a reload in sessionStorage
export interface SimState {
  autoPopMs: number | null
  chat: SimChat
  champSelect: SimChampSelect | null
  // From the game's start until play again; the lobby stays hidden meanwhile
  game: SimGame | null
  joinCodes: Record<string, unknown>
  lobby: SimLobby | null
  // Bodies loom PUT or PATCHed on paths the world doesn't model, answered back on GET
  overrides: Record<string, unknown>
  perkPages: unknown[] | null
  readyCheck: SimReadyCheck | null
  receivedInvitations: SimReceivedInvitation[]
  search: SimSearch | null
}

export interface SimWorldOptions {
  captures: SimCaptures
  // Bots' choices and timing; tests pass a fixed one
  random?: () => number
  state?: SimState
}
