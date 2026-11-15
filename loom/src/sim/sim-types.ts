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

// Plain JSON, so it survives a reload in sessionStorage
export interface SimState {
  autoPopMs: number | null
  champSelect: boolean
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
  // Served in champ select when the captures have no session
  champSelectSession?: unknown
  state?: SimState
}
