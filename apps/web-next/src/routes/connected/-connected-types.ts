export type InviteDetail = {
  summonerName: string | null
  profileIconId: number | null
  queueName: string | null
  mapName: string | null
}

export type InviteDetailsById = Record<string, InviteDetail>

export type AudioContextConstructor = typeof AudioContext
