import { array, boolean, fallback, type InferOutput, literal, object, optional, pipe, string, transform, union } from 'valibot'

import { CellId, ChampionId, QueueId, SpellId, SummonerId } from '@/core/types/branded'

import { finiteNumber, parseObjectOrNull } from './base'

const OptionalNumberSchema = fallback(optional(finiteNumber), undefined)
const OptionalStringSchema = fallback(optional(string()), undefined)
const OptionalBooleanSchema = fallback(optional(boolean()), undefined)
const NameVisibilityTypeSchema = union([literal('HIDDEN'), literal('PUBLIC')])
const OptionalNameVisibilityTypeSchema = fallback(optional(NameVisibilityTypeSchema), undefined)
const ChampionIdSchema = pipe(
  finiteNumber,
  transform((value) => {
    return ChampionId(value)
  }),
)
const OptionalChampionIdSchema = fallback(optional(ChampionIdSchema), undefined)
const CellIdSchema = pipe(
  finiteNumber,
  transform((value) => {
    return CellId(value)
  }),
)
const OptionalCellIdSchema = fallback(optional(CellIdSchema), undefined)
const QueueIdSchema = pipe(
  finiteNumber,
  transform((value) => {
    return QueueId(value)
  }),
)
const OptionalQueueIdSchema = fallback(optional(QueueIdSchema), undefined)
const SpellIdSchema = pipe(
  finiteNumber,
  transform((value) => {
    return SpellId(value)
  }),
)
const OptionalSpellIdSchema = fallback(optional(SpellIdSchema), undefined)
const SummonerIdSchema = pipe(
  finiteNumber,
  transform((value) => {
    return SummonerId(value)
  }),
)
const OptionalSummonerIdSchema = fallback(optional(SummonerIdSchema), undefined)

const RerollPointsSchema = object({
  currentPoints: OptionalNumberSchema,
  maxRolls: OptionalNumberSchema,
  numberOfRolls: OptionalNumberSchema,
  pointsCostToRoll: OptionalNumberSchema,
  pointsToReroll: OptionalNumberSchema,
})

const ChampSelectActionSchema = object({
  actorCellId: CellIdSchema,
  championId: ChampionIdSchema,
  completed: boolean(),
  id: finiteNumber,
  isAllyAction: OptionalBooleanSchema,
  isInProgress: OptionalBooleanSchema,
  type: union([literal('pick'), literal('ban')]),
})

const ChampSelectMemberSchema = object({
  assignedPosition: OptionalStringSchema,
  cellId: CellIdSchema,
  championId: ChampionIdSchema,
  championPickIntent: OptionalChampionIdSchema,
  displayName: OptionalStringSchema,
  gameName: OptionalStringSchema,
  internalName: OptionalStringSchema,
  isAutofilled: OptionalBooleanSchema,
  isHumanoid: OptionalBooleanSchema,
  nameVisibilityType: OptionalNameVisibilityTypeSchema,
  obfuscatedPuuid: OptionalStringSchema,
  obfuscatedSummonerId: OptionalNumberSchema,
  pickMode: OptionalNumberSchema,
  pickTurn: OptionalNumberSchema,
  playerAlias: OptionalStringSchema,
  puuid: OptionalStringSchema,
  selectedSkinId: OptionalNumberSchema,
  spell1Id: OptionalSpellIdSchema,
  spell2Id: OptionalSpellIdSchema,
  summonerId: OptionalSummonerIdSchema,
  tagLine: OptionalStringSchema,
  team: OptionalNumberSchema,
  wardSkinId: OptionalNumberSchema,
})

const ChampSelectTradeSchema = object({
  cellId: CellIdSchema,
  id: finiteNumber,
  state: union([literal('INVALID'), literal('AVAILABLE'), literal('BUSY'), literal('RECEIVED'), literal('SENT')]),
})

const ChampSelectTimerSchema = object({
  adjustedTimeLeftInPhase: OptionalNumberSchema,
  internalNowInEpochMs: OptionalNumberSchema,
  isInfinite: OptionalBooleanSchema,
  phase: OptionalStringSchema,
  totalTimeInPhase: OptionalNumberSchema,
})

const ChampSelectSessionSchema = object({
  actions: array(array(ChampSelectActionSchema)),
  allowBattleBoost: OptionalBooleanSchema,
  allowDuplicatePicks: OptionalBooleanSchema,
  allowLockedEvents: OptionalBooleanSchema,
  allowPlayerPickSameChampion: OptionalBooleanSchema,
  allowRerolling: OptionalBooleanSchema,
  allowSkinSelection: OptionalBooleanSchema,
  allowSubsetChampionPicks: OptionalBooleanSchema,
  benchChampionIds: fallback(optional(array(ChampionIdSchema)), undefined),
  benchEnabled: OptionalBooleanSchema,
  disallowBanningTeammateHoveredChampions: OptionalBooleanSchema,
  gameMode: OptionalStringSchema,
  hasSimultaneousBans: OptionalBooleanSchema,
  hasSimultaneousPicks: OptionalBooleanSchema,
  isLegacyChampSelect: OptionalBooleanSchema,
  isSpectating: OptionalBooleanSchema,
  localPlayerCellId: OptionalCellIdSchema,
  lockedEventIndex: OptionalNumberSchema,
  mapId: OptionalNumberSchema,
  myTeam: array(ChampSelectMemberSchema),
  queueId: OptionalQueueIdSchema,
  rerollsRemaining: OptionalNumberSchema,
  showQuitButton: OptionalBooleanSchema,
  skipChampionSelect: OptionalBooleanSchema,
  theirTeam: array(ChampSelectMemberSchema),
  timer: ChampSelectTimerSchema,
  trades: fallback(optional(array(ChampSelectTradeSchema)), undefined),
})

export type RerollPoints = InferOutput<typeof RerollPointsSchema>
export type ChampSelectSession = InferOutput<typeof ChampSelectSessionSchema>

export function parseRerollPoints(content: unknown): RerollPoints | null {
  return parseObjectOrNull(RerollPointsSchema, content)
}

export function parseChampSelectSession(content: unknown): ChampSelectSession | null {
  return parseObjectOrNull(ChampSelectSessionSchema, content)
}
