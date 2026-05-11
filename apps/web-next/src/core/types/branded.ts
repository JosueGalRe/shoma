// Branded ID types to prevent mixing numeric IDs at compile time
// e.g. ChampionId and SummonerId are both numbers but cannot be assigned to each other

export type SummonerId = number & { __brand: 'SummonerId' }
export function SummonerId(value: number): SummonerId {
  return value as SummonerId
}

export type ChampionId = number & { __brand: 'ChampionId' }
export function ChampionId(value: number): ChampionId {
  return value as ChampionId
}

export type QueueId = number & { __brand: 'QueueId' }
export function QueueId(value: number): QueueId {
  return value as QueueId
}

export type InvitationId = string & { __brand: 'InvitationId' }
export function InvitationId(value: string): InvitationId {
  return value as InvitationId
}

export type RuneId = number & { __brand: 'RuneId' }
export function RuneId(value: number): RuneId {
  return value as RuneId
}

export type SpellId = number & { __brand: 'SpellId' }
export function SpellId(value: number): SpellId {
  return value as SpellId
}

export type CellId = number & { __brand: 'CellId' }
export function CellId(value: number): CellId {
  return value as CellId
}

type AccountId = number & { __brand: 'AccountId' }
// @knip
export function AccountId(value: number): AccountId {
  return value as AccountId
}

export type Puuid = string & { __brand: 'Puuid' }
export function Puuid(value: string): Puuid {
  return value as Puuid
}
