export type InviteDetail = {
  summonerName: string | null
  profileIconId: number | null
  queueName: string | null
  mapName: string | null
}

export type InviteDetailsById = Record<string, InviteDetail>

export type AudioContextConstructor = typeof AudioContext

export type LobbyQueueOption = {
  id: number
  description: string
  mapId: number | null
}

export type LobbyMemberSnapshot = {
  summonerId: number
  isLeader: boolean
  isLocalMember: boolean
  allowedInviteOthers: boolean
  firstPositionPreference: string
  secondPositionPreference: string
  displayName: string | null
  profileIconId: number | null
}

export type SuggestedPlayer = {
  summonerId: number
  summonerName: string
}

export type ConnectedTranslate = (selector: (resources: { connected: { roleFill: string; roleUnset: string } }) => string) => string
