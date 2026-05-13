import * as v from 'valibot'

import { CellId, ChampionId, QueueId, SpellId, SummonerId } from '@/core/types/branded'

import { finiteNumber, parseObjectOrNull } from './base'

const OptionalNumberSchema = v.fallback(v.optional(finiteNumber), undefined)
const OptionalStringSchema = v.fallback(v.optional(v.string()), undefined)
const OptionalBooleanSchema = v.fallback(v.optional(v.boolean()), undefined)
const NameVisibilityTypeSchema = v.union([v.literal('HIDDEN'), v.literal('PUBLIC')])
const OptionalNameVisibilityTypeSchema = v.fallback(v.optional(NameVisibilityTypeSchema), undefined)
const ChampionIdSchema = v.pipe(finiteNumber, v.transform((value) => ChampionId(value)))
const OptionalChampionIdSchema = v.fallback(v.optional(ChampionIdSchema), undefined)
const CellIdSchema = v.pipe(finiteNumber, v.transform((value) => CellId(value)))
const OptionalCellIdSchema = v.fallback(v.optional(CellIdSchema), undefined)
const QueueIdSchema = v.pipe(finiteNumber, v.transform((value) => QueueId(value)))
const OptionalQueueIdSchema = v.fallback(v.optional(QueueIdSchema), undefined)
const SpellIdSchema = v.pipe(finiteNumber, v.transform((value) => SpellId(value)))
const OptionalSpellIdSchema = v.fallback(v.optional(SpellIdSchema), undefined)
const SummonerIdSchema = v.pipe(finiteNumber, v.transform((value) => SummonerId(value)))
const OptionalSummonerIdSchema = v.fallback(v.optional(SummonerIdSchema), undefined)

// @knip
export const RerollPointsSchema = v.object({
  currentPoints: OptionalNumberSchema,
  maxRolls: OptionalNumberSchema,
  numberOfRolls: OptionalNumberSchema,
  pointsCostToRoll: OptionalNumberSchema,
  pointsToReroll: OptionalNumberSchema,
})

// @knip
export const ChampSelectActionSchema = v.object({
  actorCellId: CellIdSchema,
  championId: ChampionIdSchema,
  completed: v.boolean(),
  id: finiteNumber,
  isAllyAction: OptionalBooleanSchema,
  isInProgress: OptionalBooleanSchema,
  type: v.union([v.literal('pick'), v.literal('ban')]),
})

// @knip
export const ChampSelectMemberSchema = v.object({
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

// @knip
export const ChampSelectTradeSchema = v.object({
  cellId: CellIdSchema,
  id: finiteNumber,
  state: v.union([
    v.literal('INVALID'),
    v.literal('AVAILABLE'),
    v.literal('BUSY'),
    v.literal('RECEIVED'),
    v.literal('SENT'),
  ]),
})

// @knip
export const ChampSelectTimerSchema = v.object({
  adjustedTimeLeftInPhase: OptionalNumberSchema,
  internalNowInEpochMs: OptionalNumberSchema,
  isInfinite: OptionalBooleanSchema,
  phase: OptionalStringSchema,
  totalTimeInPhase: OptionalNumberSchema,
})

// @knip
export const ChampSelectSessionSchema = v.object({
  actions: v.array(v.array(ChampSelectActionSchema)),
  allowBattleBoost: OptionalBooleanSchema,
  allowDuplicatePicks: OptionalBooleanSchema,
  allowLockedEvents: OptionalBooleanSchema,
  allowPlayerPickSameChampion: OptionalBooleanSchema,
  allowRerolling: OptionalBooleanSchema,
  allowSkinSelection: OptionalBooleanSchema,
  allowSubsetChampionPicks: OptionalBooleanSchema,
  benchChampionIds: v.fallback(v.optional(v.array(ChampionIdSchema)), undefined),
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
  myTeam: v.array(ChampSelectMemberSchema),
  queueId: OptionalQueueIdSchema,
  rerollsRemaining: OptionalNumberSchema,
  showQuitButton: OptionalBooleanSchema,
  skipChampionSelect: OptionalBooleanSchema,
  theirTeam: v.array(ChampSelectMemberSchema),
  timer: ChampSelectTimerSchema,
  trades: v.fallback(v.optional(v.array(ChampSelectTradeSchema)), undefined),
})

export type RerollPoints = v.InferOutput<typeof RerollPointsSchema>
// @knip
export type ChampSelectAction = v.InferOutput<typeof ChampSelectActionSchema>
// @knip
export type ChampSelectMember = v.InferOutput<typeof ChampSelectMemberSchema>
// @knip
export type ChampSelectTrade = v.InferOutput<typeof ChampSelectTradeSchema>
// @knip
export type ChampSelectTimer = v.InferOutput<typeof ChampSelectTimerSchema>
export type ChampSelectSession = v.InferOutput<typeof ChampSelectSessionSchema>

export function parseRerollPoints(content: unknown): RerollPoints | null {
  return parseObjectOrNull(RerollPointsSchema, content)
}

export function parseChampSelectSession(content: unknown): ChampSelectSession | null {
  return parseObjectOrNull(ChampSelectSessionSchema, content)
}
