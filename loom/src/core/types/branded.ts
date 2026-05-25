// Branded ID types to prevent mixing numeric IDs at compile time
// E.g. ChampionId and SummonerId are both numbers but cannot be assigned to each other

const isFiniteNumber = ((value: unknown): value is number => {
  return typeof value === 'number' && Number.isFinite(value)
}) satisfies (value: unknown) => value is number

const isString = ((value: unknown): value is string => {
  return typeof value === 'string'
}) satisfies (value: unknown) => value is string

export type SummonerId = number & { __brand: 'SummonerId' }

function isSummonerId(value: unknown): value is SummonerId {
  return isFiniteNumber(value)
}

export function SummonerId(value: number): SummonerId
export function SummonerId(value: unknown): SummonerId {
  if (!isSummonerId(value)) {
    throw new TypeError('SummonerId must be a finite number')
  }

  return value
}

export type ChampionId = number & { __brand: 'ChampionId' }

function isChampionId(value: unknown): value is ChampionId {
  return isFiniteNumber(value)
}

export function ChampionId(value: number): ChampionId
export function ChampionId(value: unknown): ChampionId {
  if (!isChampionId(value)) {
    throw new TypeError('ChampionId must be a finite number')
  }

  return value
}

export type QueueId = number & { __brand: 'QueueId' }

function isQueueId(value: unknown): value is QueueId {
  return isFiniteNumber(value)
}

export function QueueId(value: number): QueueId
export function QueueId(value: unknown): QueueId {
  if (!isQueueId(value)) {
    throw new TypeError('QueueId must be a finite number')
  }

  return value
}

export type InvitationId = string & { __brand: 'InvitationId' }

function isInvitationId(value: unknown): value is InvitationId {
  return isString(value)
}

export function InvitationId(value: string): InvitationId
export function InvitationId(value: unknown): InvitationId {
  if (!isInvitationId(value)) {
    throw new TypeError('InvitationId must be a string')
  }

  return value
}

export type RuneId = number & { __brand: 'RuneId' }

function isRuneId(value: unknown): value is RuneId {
  return isFiniteNumber(value)
}

export function RuneId(value: number): RuneId
export function RuneId(value: unknown): RuneId {
  if (!isRuneId(value)) {
    throw new TypeError('RuneId must be a finite number')
  }

  return value
}

export type SpellId = number & { __brand: 'SpellId' }

function isSpellId(value: unknown): value is SpellId {
  return isFiniteNumber(value)
}

export function SpellId(value: number): SpellId
export function SpellId(value: unknown): SpellId {
  if (!isSpellId(value)) {
    throw new TypeError('SpellId must be a finite number')
  }

  return value
}

export type CellId = number & { __brand: 'CellId' }

function isCellId(value: unknown): value is CellId {
  return isFiniteNumber(value)
}

export function CellId(value: number): CellId
export function CellId(value: unknown): CellId {
  if (!isCellId(value)) {
    throw new TypeError('CellId must be a finite number')
  }

  return value
}

type AccountId = number & { __brand: 'AccountId' }

// @knip
function isAccountId(value: unknown): value is AccountId {
  return isFiniteNumber(value)
}

export function AccountId(value: number): AccountId
export function AccountId(value: unknown): AccountId {
  if (!isAccountId(value)) {
    throw new TypeError('AccountId must be a finite number')
  }

  return value
}

export type Puuid = string & { __brand: 'Puuid' }

function isPuuid(value: unknown): value is Puuid {
  return isString(value)
}

export function Puuid(value: string): Puuid
export function Puuid(value: unknown): Puuid {
  if (!isPuuid(value)) {
    throw new TypeError('Puuid must be a string')
  }

  return value
}
