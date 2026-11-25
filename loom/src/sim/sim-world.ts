import { LcuHttpMethod, LcuPaths } from '@shoma/protocol-contract'

import { MULTITEAM_LOBBY_CONFIG } from '@/features/modes/multiteam-lobby'
import { isRecord } from '@/lib/type-guards'

import {
  advanceChampSelect,
  answerLocalSwap,
  champSelectSessionDto,
  clearLocalSwap,
  createArenaChampSelect,
  createChampSelect,
  fastForwardChampSelect,
  ongoingSwapDto,
  patchLocalAction,
  patchLocalSelection,
  receiveSwap,
  requestLocalSwap,
  SIM_PICK_LANES,
  swapLocalWithBench,
} from './sim-champ-select'
import {
  appendMessage,
  CHAT_SETTINGS,
  CLASH_CONVERSATION_ID,
  CLASH_ROSTER,
  CLASH_TEAMMATES,
  conversationDto,
  countUnread,
  EMPTY_SIM_CHAT,
  friendRequestDto,
  livenFriends,
  messageDto,
  participantDto,
  pickReply,
  readFriendRequest,
  readMessages,
  REPLY_MS,
} from './sim-social'

import type { SimChampSelectTarget, SimSeat } from './sim-champ-select'
import type {
  SimBot,
  SimCaptures,
  SimChampSelect,
  SimEvent,
  SimGame,
  SimLobby,
  SimMember,
  SimPerson,
  SimResponse,
  SimState,
  SimWorldOptions,
} from './sim-types'

const TICK_MS = 500

const INVITE_ACCEPT_MS = 1500
const EVERYONE_READY_MS = 1500
const CHAMP_SELECT_AFTER_ACCEPT_MS = 2500

// The LCU's ready check runs to 12 s (the legacy UI's bar), past the client's 10.7 s countdown, so the modal sits
// Locked for a moment before an unanswered pop goes back to the lobby
export const READY_CHECK_TIMEOUT_SECONDS = 12

const DEFAULT_AUTO_POP_MS = 6000
// Normal Draft (Reclutamiento), for the panel's champ select scenarios
const DRAFT_QUEUE_ID = 400
// The pick mode of ARAM's cards and bench
const ALL_RANDOM_PICK_MODE = 'AllRandomPickStrategy'
// Arena and its variants, as the client tells them (GAME_MODES_WITH_SUBTEAMS): blind pick shares their SimulPickStrategy
const ARENA_GAME_MODE = 'CHERRY'
// Arena as the client knew it before its variants, for a queue the client's table doesn't have
const ARENA_FALLBACK = { playerSlotCount: 2, subteamCount: 8 }
// Arena de Valentía, recorded dealing each player 5 champions. The queue looks like any Arena's, so it goes by id
// Shortcut: another variant that deals champions needs its id here
const DEALT_ARENA_OPTIONS: Partial<Record<number, number>> = { 1740: 5 }

// ARAM, for the panel's champ select scenarios
export const ARAM_QUEUE_ID = 450

const NOT_FOUND = { content: { errorCode: 'RPC_ERROR', httpStatus: 404, message: 'Not found' }, status: 404 }
const NO_CONTENT = { content: null, status: 204 }
const INVALID_ACTION = { content: { errorCode: 'RPC_ERROR', httpStatus: 500, message: 'Invalid action' }, status: 500 }

// The gameflow moves through these on its own, one tick each
const NEXT_GAME_PHASE: Partial<Record<SimGame['phase'], SimGame['phase']>> = {
  GameStart: 'InProgress',
  PreEndOfGame: 'EndOfGame',
  WaitingForStats: 'PreEndOfGame',
}

const LOCAL_FALLBACK: SimPerson = {
  gameName: 'Sim',
  iconId: 29,
  level: 120,
  puuid: '00000000-0000-4000-8000-000000000001',
  summonerId: 1,
  tagLine: 'LOOM',
}

// People to fill a party with when the captures have no friends
const SYNTHETIC_PEOPLE: SimPerson[] = [
  ['Kalista Main', 'EUW'],
  ['moonwell', 'LAN'],
  ['Pyke Enjoyer', '0001'],
  ['vex is fine', 'NA1'],
  ['Baron Pit', 'LAS'],
  ['Zilean Clock', 'KR1'],
].map(([gameName = '', tagLine = ''], index) => {
  return {
    gameName,
    iconId: [4568, 5367, 6271, 4902, 5848, 6060][index] ?? 29,
    level: 80 + index * 47,
    puuid: `00000000-0000-4000-8000-0000000001${String(index).padStart(2, '0')}`,
    summonerId: 9_000_001 + index,
    tagLine,
  }
})

// Matchmaking's teammates in champ select
const STRANGERS: SimPerson[] = [
  ['Rift Scuttler', 'LAN'],
  ['poro snax', 'EUW'],
  ['Blue Sentinel', 'NA1'],
  ['Elder Drake', 'BR1'],
  ['wardless', 'LAS'],
].map(([gameName = '', tagLine = ''], index) => {
  return {
    gameName,
    iconId: [6082, 4655, 5475, 6339, 5212][index] ?? 29,
    level: 60 + index * 71,
    puuid: `00000000-0000-4000-8000-0000000002${String(index).padStart(2, '0')}`,
    summonerId: 9_100_001 + index,
    tagLine,
  }
})

// Swift Play picks for members who join: champion, skin, spells and position for each option
const SYNTHETIC_SLOTS = [
  [103, 'MIDDLE', 64, 'JUNGLE'],
  [222, 'BOTTOM', 51, 'BOTTOM'],
  [412, 'UTILITY', 89, 'UTILITY'],
  [86, 'TOP', 122, 'TOP'],
  [64, 'JUNGLE', 254, 'JUNGLE'],
  [99, 'MIDDLE', 517, 'MIDDLE'],
] as const

const POSITION_PAIRS = [
  ['JUNGLE', 'TOP'],
  ['BOTTOM', 'UTILITY'],
  ['UTILITY', 'MIDDLE'],
  ['TOP', 'FILL'],
  ['MIDDLE', 'BOTTOM'],
] as const

const MEMBER_TEMPLATE = {
  allowedChangeActivity: false,
  allowedInviteOthers: false,
  allowedKickOthers: false,
  allowedStartActivity: false,
  allowedToggleInvite: false,
  autoFillEligible: true,
  autoFillProtectedForPromos: false,
  autoFillProtectedForRemedy: false,
  autoFillProtectedForSoloing: false,
  autoFillProtectedForStreaking: false,
  botChampionId: 0,
  botDifficulty: 'NONE',
  botId: '',
  botPosition: 'NONE',
  botUuid: '',
  fifthPositionPreference: null,
  fourthPositionPreference: null,
  intraSubteamPosition: null,
  isBot: false,
  isSpectator: false,
  ready: true,
  showGhostedBanner: false,
  strawberryMapId: null,
  subteamIndex: null,
  summonerInternalName: '',
  summonerName: '',
  teamId: 0,
  thirdPositionPreference: null,
}

const GAME_CONFIG_TEMPLATE = {
  customLobbyName: 'Custom Lobby',
  customMutatorName: '',
  customRewardsDisabledReasons: [],
  customSpectatorPolicy: 'NotAllowed',
  customSpectators: [],
  customTeam100: [],
  customTeam200: [],
  isTeamBuilderManaged: false,
  maxHumanPlayers: 0,
  maxLobbySpectatorCount: 0,
  numberOfTeamsInLobby: 1,
  pickType: '',
  premadeSizeAllowed: true,
  shouldForceScarcePositionSelection: false,
}

const LOW_PRIORITY_DATA = {
  bustedLeaverAccessToken: '',
  penalizedSummonerIds: [],
  penaltyTime: 0,
  penaltyTimeRemaining: 0,
  reason: '',
}

// Custom games' bots, a couple per lane: what /lol-lobby/v2/lobby/custom/available-bots and
// /lol-perks/v1/recommended-champion-positions answer
const SIM_BOTS: [championId: number, lane: string][] = [
  [86, 'TOP'],
  [54, 'TOP'],
  [19, 'JUNGLE'],
  [11, 'JUNGLE'],
  [1, 'MIDDLE'],
  [99, 'MIDDLE'],
  [22, 'BOTTOM'],
  [21, 'BOTTOM'],
  [16, 'UTILITY'],
  [37, 'UTILITY'],
]

// A custom queue's pick strategy (gameTypeConfig.id) by the name the lobby reports
const CUSTOM_MUTATOR_NAMES: Record<number, string> = {
  18: 'GAME_CFG_DRAFT_STD',
  19: 'GAME_CFG_PICK_BLIND',
  21: 'GAME_CFG_PICK_RANDOM',
  6: 'GAME_CFG_DRAFT_TOURNAMENT',
}

const EMPTY_SLOT = { championId: 0, perks: '', positionPreference: 'UNSELECTED', skinId: 0, spell1: 0, spell2: 0 }

export function createInitialSimState(): SimState {
  return {
    autoPopMs: DEFAULT_AUTO_POP_MS,
    champSelect: null,
    chat: EMPTY_SIM_CHAT,
    game: null,
    joinCodes: {},
    lobby: null,
    lobbyNotifications: [],
    overrides: {},
    perkPages: null,
    readyCheck: null,
    receivedInvitations: [],
    search: null,
  }
}

function readNumber(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

function readString(value: unknown, fallback: string): string {
  return typeof value === 'string' ? value : fallback
}

function readBoolean(value: unknown, fallback: boolean): boolean {
  return typeof value === 'boolean' ? value : fallback
}

function readRecord(value: unknown): Record<string, unknown> {
  return isRecord(value) && !Array.isArray(value) ? value : {}
}

function ok(content: unknown, status = 200): SimResponse {
  return { content, status }
}

// A path's shape: ids and uuids become wildcards, so one capture answers every champion or summoner
function toShape(path: string): string {
  return path
    .split('?')[0]
    .split('/')
    .map((segment) => {
      return /^\d+$/.test(segment) || /^[\da-f]{8}-[\da-f-]{27}$/i.test(segment) ? '*' : segment
    })
    .join('/')
}

interface SimRoute {
  method: string
  pattern: RegExp
  handle: (groups: Partial<Record<string, string>>, body: unknown) => SimResponse
}

/**
 * The League client as loom sees it: GETs answered from captures of a real client, and the state loom changes
 * (lobby, queue, ready check, invitations, rune pages) kept here and pushed as events like the LCU does.
 */
export class SimWorld {
  readonly #captures: SimCaptures
  readonly #capturesByShape = new Map<string, SimResponse>()
  readonly #listeners = new Set<(event: SimEvent) => void>()
  readonly #changeListeners = new Set<() => void>()
  readonly #published = new Map<string, string>()
  readonly #routes: SimRoute[]
  readonly #local: SimPerson
  readonly #people: SimPerson[]
  readonly #random: () => number
  readonly #ticker: ReturnType<typeof setInterval>
  #state: SimState

  constructor({ captures, random = Math.random, state = createInitialSimState() }: SimWorldOptions) {
    this.#captures = captures
    this.#random = random
    this.#state = state

    for (const [path, response] of Object.entries(captures)) {
      if (response.status === 200 && !this.#capturesByShape.has(toShape(path))) {
        this.#capturesByShape.set(toShape(path), response)
      }
    }

    this.#local = this.#readLocalPerson()
    this.#people = [...this.#readFriends(), ...SYNTHETIC_PEOPLE]
    this.#routes = this.#createRoutes()
    this.#publish()

    this.#ticker = setInterval(() => {
      this.#advance()
    }, TICK_MS)
  }

  get state(): SimState {
    return this.#state
  }

  // Arena changes variant (and queue) every few patches: every captured one, open or not
  get arenaQueues(): { id: number; name: string }[] {
    const queues = this.#readCaptureContent(LcuPaths.gameQueues.queues)

    return (Array.isArray(queues) ? queues : []).map(readRecord).flatMap((queue) => {
      return queue.gameMode === ARENA_GAME_MODE ? [{ id: readNumber(queue.id, 0), name: readString(queue.name, '') }] : []
    })
  }

  get phase(): string {
    const { champSelect, game, lobby, readyCheck, search } = this.#state

    if (game) {
      return game.phase
    }

    if (champSelect) {
      return 'ChampSelect'
    }

    if (readyCheck) {
      return 'ReadyCheck'
    }

    if (search) {
      return 'Matchmaking'
    }

    return lobby ? 'Lobby' : 'None'
  }

  dispose(): void {
    clearInterval(this.#ticker)
    this.#listeners.clear()
    this.#changeListeners.clear()
  }

  onEvent(listener: (event: SimEvent) => void): () => void {
    this.#listeners.add(listener)

    return () => {
      this.#listeners.delete(listener)
    }
  }

  // Any state change, for the panel and persistence
  onChange(listener: () => void): () => void {
    this.#changeListeners.add(listener)

    return () => {
      this.#changeListeners.delete(listener)
    }
  }

  request(method: string, path: string, body?: unknown): SimResponse {
    for (const route of this.#routes) {
      const match = route.method === method ? route.pattern.exec(path) : null

      if (match) {
        const response = route.handle(match.groups ?? {}, body)

        if (method !== LcuHttpMethod.GET) {
          this.#publish()
        }

        return response
      }
    }

    if (method === LcuHttpMethod.GET) {
      return this.#readCapture(path)
    }

    if (method === LcuHttpMethod.PUT || method === LcuHttpMethod.PATCH) {
      const previous = method === LcuHttpMethod.PATCH ? readRecord(this.#get(path).content) : {}

      this.#update({
        overrides: {
          ...this.#state.overrides,
          [path]: isRecord(body) && !Array.isArray(body) ? { ...previous, ...body } : body,
        },
      })

      return NO_CONTENT
    }

    console.warn(`[sim] no handler for ${method} ${path}`)

    return NO_CONTENT
  }

  addMember(): void {
    const { lobby } = this.#state

    if (!lobby || lobby.members.length >= this.#maxLobbySize(lobby.queueId)) {
      return
    }

    const person = this.#people.find((candidate) => {
      return !lobby.members.some((member) => {
        return member.summonerId === candidate.summonerId
      })
    })

    if (person) {
      this.#update({ lobby: { ...lobby, members: [...lobby.members, this.#createMember(person, lobby.members.length)] } })
    }
  }

  removeMember(): void {
    const { lobby } = this.#state
    const last = lobby?.members.findLast((member) => {
      return member.summonerId !== this.#local.summonerId
    })

    if (lobby && last) {
      this.#update({ lobby: this.#withoutMember(lobby, last.summonerId) })
    }
  }

  // The owner kicks the local player: the lobby is gone for them and the client gets its KICKED notification
  kickLocalPlayer(): void {
    if (!this.#state.lobby) {
      return
    }

    const now = Date.now()
    const notification = {
      notificationId: `kicked-${now}`,
      notificationReason: 'KICKED',
      summonerIds: [this.#local.summonerId],
      timestamp: now,
    }

    this.#update({
      champSelect: null,
      lobby: null,
      lobbyNotifications: [...this.#state.lobbyNotifications, notification],
      readyCheck: null,
      search: null,
    })
  }

  // Swift Play's party ready of everyone but the local player
  setOthersReady(isReady: boolean): void {
    this.#updateMembers((member) => {
      return member.summonerId === this.#local.summonerId ? member : { ...member, isReady }
    })
  }

  popMatch(): void {
    if (this.#state.search && !this.#state.readyCheck) {
      this.#update({ readyCheck: { acceptedAt: null, poppedAt: Date.now(), response: 'None' } })
    }
  }

  // Someone else declines: the ready check closes and the search goes on
  strangerDeclines(): void {
    const { search } = this.#state

    if (search && this.#state.readyCheck) {
      this.#update({ readyCheck: null, search: { ...search, popAt: this.#nextPopAt() } })
    }
  }

  receiveInvitation(): void {
    const from = this.#people[this.#state.receivedInvitations.length % this.#people.length] ?? LOCAL_FALLBACK
    const invitationId = `sim-invite-${Date.now()}`

    this.#update({
      receivedInvitations: [
        ...this.#state.receivedInvitations,
        { fromSummonerId: from.summonerId, invitationId, queueId: 480, timestamp: Date.now() },
      ],
    })
  }

  // Someone else dodges: champ select closes and the party goes back into the queue
  dodgeChampSelect(): void {
    if (this.#state.champSelect) {
      this.#update({ champSelect: null, search: { popAt: this.#nextPopAt(), startedAt: Date.now() } })
    }
  }

  // Panel scenarios: a new champ select of the queue's kind, played fast up to the local ban, pick or finalization.
  // The lobby stays when its queue picks the same way
  jumpToChampSelect(target: SimChampSelectTarget | 'planning', queueId = DRAFT_QUEUE_ID): void {
    const { lobby } = this.#state
    const isSameKind = lobby !== null && this.#champSelectKind(lobby.queueId) === this.#champSelectKind(queueId)
    const now = Date.now()

    this.#update({
      game: null,
      lobby: isSameKind ? lobby : this.#createLobby(queueId, false),
      readyCheck: null,
      search: null,
    })

    this.#startChampSelect(now)

    const { champSelect } = this.#state

    if (champSelect && target !== 'planning') {
      this.#update({ champSelect: fastForwardChampSelect(champSelect, { now, random: this.#random, target }) })
    }
  }

  // An online friend writes first, opening the conversation if there was none: unread, unless it's on screen
  receiveMessage(): void {
    const friends = this.#readCaptureContent(LcuPaths.social.friends)
    const online = livenFriends(Array.isArray(friends) ? friends : [])
      .map(readRecord)
      .filter((friend) => {
        return friend.availability !== 'offline'
      })
    const id = readString(online[Math.floor(this.#random() * online.length)]?.id, '')

    if (!id) {
      return
    }

    if (!this.#findConversation(id)) {
      const { chat } = this.#state

      this.#update({ chat: { ...chat, conversations: [...chat.conversations, id], messages: { ...chat.messages, [id]: [] } } })
    }

    const conversation = this.#findConversation(id)
    const now = Date.now()

    if (conversation) {
      const message = { body: pickReply(this.#random), fromPid: id, id: `${now}:${id}`, timestamp: now }

      this.#update({ chat: countUnread(appendMessage(this.#state.chat, conversation, message), id) })
    }
  }

  // The player joins a Clash team, whose chat the client joins on its own; a teammate says hi, unread
  joinClash(): void {
    if (this.#state.chat.clash) {
      return
    }

    this.#update({ chat: { ...this.#state.chat, clash: true } })

    const conversation = this.#findConversation(CLASH_CONVERSATION_ID)
    const now = Date.now()

    if (conversation) {
      const message = {
        body: pickReply(this.#random),
        fromPid: this.#pickWriter(conversation),
        id: `${now}:clash`,
        timestamp: now,
      }

      this.#update({ chat: countUnread(appendMessage(this.#state.chat, conversation, message), CLASH_CONVERSATION_ID) })
    }
  }

  // An ally asks the local player to trade champions, which nothing in the recordings did on its own
  requestSwapFromAlly(): void {
    const { champSelect } = this.#state

    if (champSelect) {
      this.#update({ champSelect: receiveSwap(champSelect, Date.now(), this.#random) })
    }
  }

  endGame(): void {
    const { game } = this.#state

    if (game?.phase === 'InProgress') {
      this.#update({ game: { ...game, phase: 'WaitingForStats' } })
    }
  }

  // The end-of-game screen's Play Again: the same party, nobody ready
  playAgain(): void {
    if (this.#state.game?.phase === 'EndOfGame') {
      this.#update({ game: null })

      this.#updateMembers((member) => {
        return { ...member, isReady: false }
      })
    }
  }

  setAutoPop(autoPopMs: number | null): void {
    const { search } = this.#state

    this.#update({
      autoPopMs,
      search: search ? { ...search, popAt: autoPopMs === null ? null : Date.now() + autoPopMs } : null,
    })
  }

  reset(): void {
    this.#update({ ...createInitialSimState(), autoPopMs: this.#state.autoPopMs })
  }

  #update(patch: Partial<SimState>): void {
    this.#state = { ...this.#state, ...patch }
    this.#publish()
  }

  #updateMembers(change: (member: SimMember) => SimMember): void {
    const { lobby } = this.#state

    if (lobby) {
      this.#update({ lobby: { ...lobby, members: lobby.members.map(change) } })
    }
  }

  #nextPopAt(): number | null {
    return this.#state.autoPopMs === null ? null : Date.now() + this.#state.autoPopMs
  }

  #advance(): void {
    const now = Date.now()

    this.#answerChats(now)

    const { champSelect, game, lobby, readyCheck, search } = this.#state
    const nextGamePhase = game ? NEXT_GAME_PHASE[game.phase] : undefined

    if (game && nextGamePhase) {
      this.#update({ game: { ...game, phase: nextGamePhase } })

      return
    }

    if (champSelect) {
      const step = advanceChampSelect(champSelect, now, this.#random)

      if (step.outcome === 'start') {
        this.#update({ champSelect: null, game: { phase: 'GameStart', startedAt: now } })
      } else if (step.outcome === 'dodge') {
        this.#update({ champSelect: null })
      } else if (step.champSelect !== champSelect) {
        this.#update({ champSelect: step.champSelect })
      }

      return
    }

    if (search && !readyCheck && search.popAt !== null && now >= search.popAt) {
      this.popMatch()

      return
    }

    if (readyCheck?.response === 'Accepted' && readyCheck.acceptedAt !== null) {
      if (now - readyCheck.acceptedAt >= CHAMP_SELECT_AFTER_ACCEPT_MS) {
        this.#startChampSelect(now)

        return
      }
    } else if (readyCheck && now - readyCheck.poppedAt >= READY_CHECK_TIMEOUT_SECONDS * 1000) {
      // Not answering takes the party out of the queue
      this.#update({ readyCheck: null, search: null })

      return
    }

    const due = lobby?.invitations.find((invitation) => {
      return invitation.state === 'Pending' && now >= invitation.acceptAt
    })

    if (lobby && due) {
      const person = this.#findPerson(due.summonerId)
      const invitations = lobby.invitations.map((invitation) => {
        return invitation === due ? { ...invitation, state: 'Accepted' } : invitation
      })
      const isFull = lobby.members.length >= this.#maxLobbySize(lobby.queueId)
      const members = person && !isFull ? [...lobby.members, this.#createMember(person, lobby.members.length)] : lobby.members

      this.#update({ lobby: { ...lobby, invitations, members } })

      return
    }

    // The queue timer and the ready-check timer move every tick
    this.#publish()
  }

  // Pushes every state path whose answer changed, as the LCU's events would
  #publish(): void {
    // The champ select session goes first: the LCU creates it just before the phase turns ChampSelect
    const paths = [
      LcuPaths.champSelect.session,
      LcuPaths.gameflow.phase,
      LcuPaths.gameflow.session,
      LcuPaths.lobby.lobby,
      LcuPaths.lobby.localMemberPlayerSlots,
      LcuPaths.lobby.invitations,
      LcuPaths.lobby.receivedInvitations,
      LcuPaths.lobby.notifications,
      LcuPaths.matchmaking.search,
      LcuPaths.lobby.matchmakingSearch,
      LcuPaths.matchmaking.readyCheck,
      LcuPaths.champSelect.pickableChampionIds,
      LcuPaths.champSelect.bannableChampionIds,
      LcuPaths.champSelect.pickableSkinIds,
      LcuPaths.champSelect.subsetChampionList,
      LcuPaths.champSelect.ongoingChampionSwap,
      LcuPaths.perks.pages,
      LcuPaths.perks.currentPage,
      LcuPaths.social.conversations,
      LcuPaths.social.activeConversation,
      LcuPaths.clash.chatRosters,
      LcuPaths.social.conversationParticipants(CLASH_CONVERSATION_ID),
      LcuPaths.social.friendRequests,
      LcuPaths.social.settings,
      ...Object.keys(this.#state.chat.messages).map((id) => {
        return LcuPaths.social.conversationMessages(id)
      }),
      ...Object.keys(this.#state.overrides),
    ]
    let hasChanged = false

    for (const path of paths) {
      const response = this.#get(path)
      const content = response.status === 404 ? null : response.content
      const serialized = JSON.stringify([response.status, content])

      if (this.#published.get(path) !== serialized) {
        hasChanged = true
        this.#published.set(path, serialized)

        const status = response.status === 404 ? 404 : 200

        this.#listeners.forEach((listener) => {
          listener({ content, path, status })
        })
      }
    }

    if (hasChanged) {
      this.#changeListeners.forEach((listener) => {
        listener()
      })
    }
  }

  // The captured conversations plus the ones loom opened, each with the world's messages
  #conversations(): Record<string, unknown>[] {
    const captured = this.#readCaptureContent(LcuPaths.social.conversations)
    const friends = this.#readCaptureContent(LcuPaths.social.friends)
    const opened = this.#state.chat.conversations.map((id) => {
      const friend = readRecord(
        Array.isArray(friends)
          ? friends.find((candidate: unknown) => {
              return readRecord(candidate).id === id
            })
          : null,
      )

      return { gameName: friend.gameName, gameTag: friend.gameTag, id, name: '', pid: id, type: 'chat', unreadMessageCount: 0 }
    })

    const clash = this.#state.chat.clash
      ? [
          {
            id: CLASH_CONVERSATION_ID,
            isMuted: false,
            name: '',
            pid: CLASH_CONVERSATION_ID,
            type: 'clash',
            unreadMessageCount: 0,
          },
        ]
      : []

    return [...(Array.isArray(captured) ? captured.map(readRecord) : []), ...opened, ...clash]
  }

  // The Clash team's other members: the first people of the world
  #clashTeammates(): SimPerson[] {
    return this.#people.slice(0, CLASH_TEAMMATES)
  }

  // Who writes in a conversation: the friend of a 1:1, a teammate at random in the Clash team's
  #pickWriter(conversation: Record<string, unknown>): string {
    const teammates = this.#clashTeammates()
    const teammate = teammates[Math.floor(this.#random() * teammates.length)]

    return conversation.type === 'clash' && teammate ? `${teammate.puuid}@la1.pvp.net` : readString(conversation.id, '')
  }

  #findConversation(id: string): Record<string, unknown> | undefined {
    return this.#conversations().find((conversation) => {
      return conversation.id === id
    })
  }

  // Friends answer a 1:1 chat a moment after each message
  #answerChats(now: number): void {
    const { chat } = this.#state
    const due = chat.replies.filter((reply) => {
      return now >= reply.dueAt
    })

    if (due.length === 0) {
      return
    }

    let next: typeof chat = {
      ...chat,
      replies: chat.replies.filter((reply) => {
        return now < reply.dueAt
      }),
    }

    for (const { conversationId } of due) {
      const conversation = this.#findConversation(conversationId)

      if (conversation) {
        next = appendMessage(next, conversation, {
          body: pickReply(this.#random),
          fromPid: this.#pickWriter(conversation),
          id: `${now}:${conversationId}`,
          timestamp: now,
        })

        next = countUnread(next, conversationId)
      }
    }

    this.#update({ chat: next })
  }

  #get(path: string): SimResponse {
    return this.request(LcuHttpMethod.GET, path)
  }

  #readCapture(path: string): SimResponse {
    if (path in this.#state.overrides) {
      return ok(this.#state.overrides[path])
    }

    return this.#captures[path] ?? this.#capturesByShape.get(toShape(path)) ?? NOT_FOUND
  }

  #readCaptureContent(path: string): unknown {
    const response = this.#captures[path]

    return response?.status === 200 ? response.content : null
  }

  #localPid(): string {
    return readString(readRecord(this.#readCaptureContent(LcuPaths.social.me)).pid, `${this.#local.puuid}@la1.pvp.net`)
  }

  #readLocalPerson(): SimPerson {
    const summoner = readRecord(this.#readCaptureContent(LcuPaths.summoner.currentSummoner))

    return {
      gameName: readString(summoner.gameName, LOCAL_FALLBACK.gameName),
      iconId: readNumber(summoner.profileIconId, LOCAL_FALLBACK.iconId),
      level: readNumber(summoner.summonerLevel, LOCAL_FALLBACK.level),
      puuid: readString(summoner.puuid, LOCAL_FALLBACK.puuid),
      summonerId: readNumber(summoner.summonerId, LOCAL_FALLBACK.summonerId),
      tagLine: readString(summoner.tagLine, LOCAL_FALLBACK.tagLine),
    }
  }

  #readFriends(): SimPerson[] {
    const friends = this.#readCaptureContent(LcuPaths.social.friends)

    if (!Array.isArray(friends)) {
      return []
    }

    return friends.flatMap((value: unknown) => {
      const friend = readRecord(value)
      const summonerId = readNumber(friend.summonerId, 0)

      if (summonerId <= 0) {
        return []
      }

      return [
        {
          gameName: readString(friend.gameName, 'Friend'),
          iconId: readNumber(friend.icon, 29),
          level: 30 + (summonerId % 400),
          puuid: readString(friend.puuid, ''),
          summonerId,
          tagLine: readString(friend.gameTag, ''),
        },
      ]
    })
  }

  #findPerson(summonerId: number): SimPerson | null {
    if (summonerId === this.#local.summonerId) {
      return this.#local
    }

    return (
      [...this.#people, ...STRANGERS].find((person) => {
        return person.summonerId === summonerId
      }) ?? null
    )
  }

  #queue(queueId: number): Record<string, unknown> {
    const queues = this.#readCaptureContent(LcuPaths.gameQueues.queues)
    const queue = Array.isArray(queues)
      ? queues.find((value: unknown) => {
          return readRecord(value).id === queueId
        })
      : null

    return readRecord(queue)
  }

  // Which jumps keep the lobby: a draft or ARAM one keeps its queue (Ranked stays Ranked); each Arena variant is its own
  #champSelectKind(queueId: number): string {
    const { gameMode, pickMode } = this.#queue(queueId)

    return gameMode === ARENA_GAME_MODE ? String(queueId) : `${readString(gameMode, '')}:${readString(pickMode, '')}`
  }

  #maxLobbySize(queueId: number): number {
    const multiteam = MULTITEAM_LOBBY_CONFIG[queueId]

    if (multiteam) {
      return multiteam.playerSlotCount * multiteam.subteamCount
    }

    const sizes = this.#queue(queueId).allowablePremadeSizes

    return Array.isArray(sizes) && sizes.length > 0
      ? Math.min(
          5,
          Math.max(
            ...sizes.map((size) => {
              return readNumber(size, 0)
            }),
          ),
        )
      : 5
  }

  #createMember(person: SimPerson, index: number): SimMember {
    const slots = SYNTHETIC_SLOTS[(index - 1 + SYNTHETIC_SLOTS.length) % SYNTHETIC_SLOTS.length] ?? SYNTHETIC_SLOTS[0]
    const [firstPosition, secondPosition] = POSITION_PAIRS[(index - 1 + POSITION_PAIRS.length) % POSITION_PAIRS.length] ?? [
      'FILL',
      'UNSELECTED',
    ]
    const [firstChampion, firstSlotPosition, secondChampion, secondSlotPosition] = slots

    return {
      firstPosition,
      isLeader: false,
      isReady: false,
      playerSlots: [
        { ...EMPTY_SLOT, championId: firstChampion, positionPreference: firstSlotPosition, spell1: 4, spell2: 14 },
        { ...EMPTY_SLOT, championId: secondChampion, positionPreference: secondSlotPosition, spell1: 4, spell2: 11 },
      ],
      secondPosition,
      summonerId: person.summonerId,
    }
  }

  #createLocalMember(isLeader: boolean): SimMember {
    return {
      firstPosition: 'UNSELECTED',
      isLeader,
      isReady: false,
      playerSlots: [EMPTY_SLOT, EMPTY_SLOT],
      secondPosition: 'UNSELECTED',
      summonerId: this.#local.summonerId,
    }
  }

  #withoutMember(lobby: NonNullable<SimState['lobby']>, summonerId: number): NonNullable<SimState['lobby']> {
    return {
      ...lobby,
      invitations: lobby.invitations.filter((invitation) => {
        return invitation.summonerId !== summonerId
      }),
      members: lobby.members.filter((member) => {
        return member.summonerId !== summonerId
      }),
    }
  }

  // Each member's Arena slot: the one they moved to while it's in the queue's teams, else the first free one in order
  #subteams(lobby: SimLobby): Map<number, [number, number]> {
    const multiteam = MULTITEAM_LOBBY_CONFIG[lobby.queueId]
    const slots = new Map<number, [number, number]>()

    if (!multiteam) {
      return slots
    }

    const { playerSlotCount, subteamCount } = multiteam
    const taken = new Set<string>()
    const isValid = ([index, position]: [number, number]): boolean => {
      return index >= 1 && index <= subteamCount && position >= 1 && position <= playerSlotCount
    }

    for (const { subteam, summonerId } of lobby.members) {
      if (subteam && isValid(subteam) && !taken.has(subteam.join(','))) {
        slots.set(summonerId, subteam)
        taken.add(subteam.join(','))
      }
    }

    let free = 0

    for (const { summonerId } of lobby.members) {
      while (!slots.has(summonerId) && free < playerSlotCount * subteamCount) {
        const slot: [number, number] = [Math.floor(free / playerSlotCount) + 1, (free % playerSlotCount) + 1]

        free += 1

        if (!taken.has(slot.join(','))) {
          slots.set(summonerId, slot)
          taken.add(slot.join(','))
        }
      }
    }

    return slots
  }

  #memberDto(member: SimMember, subteam?: [number, number]): Record<string, unknown> {
    const person = this.#findPerson(member.summonerId) ?? LOCAL_FALLBACK
    const { isLeader } = member

    return {
      ...MEMBER_TEMPLATE,
      allowedChangeActivity: isLeader,
      allowedInviteOthers: isLeader || this.#state.lobby?.partyType === 'open' || member.canInvite === true,
      allowedKickOthers: isLeader,
      allowedStartActivity: isLeader,
      allowedToggleInvite: isLeader,
      firstPositionPreference: member.firstPosition,
      intraSubteamPosition: subteam?.[1] ?? null,
      isLeader,
      memberData: member.isReady ? { isPlayerReady: 'true' } : {},
      playerSlots: member.playerSlots,
      puuid: person.puuid,
      secondPositionPreference: member.secondPosition,
      subteamIndex: subteam?.[0] ?? null,
      summonerIconId: person.iconId,
      summonerId: person.summonerId,
      summonerLevel: person.level,
    }
  }

  #lobbyDto(): SimResponse {
    const { game, lobby } = this.#state

    // The client deletes the lobby when the game starts
    if (!lobby || game) {
      return NOT_FOUND
    }

    const queue = this.#queue(lobby.queueId)
    const maxLobbySize = this.#maxLobbySize(lobby.queueId)
    const subteams = this.#subteams(lobby)
    const members = lobby.members.map((member) => {
      return this.#memberDto(member, subteams.get(member.summonerId))
    })
    const localMember =
      members.find((member) => {
        return member.summonerId === this.#local.summonerId
      }) ?? null
    const numPlayersPerTeam = readNumber(queue.numPlayersPerTeam, 5)
    const { custom } = lobby

    return ok({
      canStartActivity: true,
      gameConfig: {
        ...GAME_CONFIG_TEMPLATE,
        allowablePremadeSizes: Array.isArray(queue.allowablePremadeSizes) ? queue.allowablePremadeSizes : [1, 2, 3, 4, 5],
        gameMode: readString(queue.gameMode, 'CLASSIC'),
        isCustom: lobby.isCustom,
        isLobbyFull: members.length >= maxLobbySize,
        mapId: readNumber(queue.mapId, 11),
        maxLobbySize,
        maxTeamSize: numPlayersPerTeam,
        numPlayersPerTeam,
        queueId: lobby.queueId,
        showPositionSelector: readBoolean(queue.showPositionSelector, false),
        showQuickPlaySlotSelection: readBoolean(queue.showQuickPlaySlotSelection, false),
        ...(custom
          ? {
              customLobbyName: custom.name,
              customMutatorName: custom.mutatorName,
              customTeam100: this.#customTeamDto(100),
              customTeam200: this.#customTeamDto(200),
              maxLobbySize: custom.teamSize * 2,
              maxTeamSize: custom.teamSize,
            }
          : {}),
      },
      invitations: this.#invitationsDto(),
      localMember,
      members,
      mucJwtDto: { channelClaim: '', domain: '', jwt: '', targetRegion: '' },
      multiUserChatId: `sim-${lobby.partyId}`,
      multiUserChatPassword: '',
      partyId: lobby.partyId,
      partyType: lobby.partyType,
      popularChampions: [],
      restrictions: [],
      scarcePositions: ['UTILITY', 'JUNGLE'],
      warnings: [],
    })
  }

  // A custom game's team as the client lists it: its players, then its bots
  #customTeamDto(team: 100 | 200): Record<string, unknown>[] {
    const { lobby } = this.#state
    const players = (lobby?.members ?? []).flatMap((member) => {
      return (member.team ?? 100) === team ? [{ ...this.#memberDto(member), teamId: team }] : []
    })
    const bots = (lobby?.custom?.bots ?? []).flatMap((bot) => {
      return bot.team === team
        ? [
            {
              ...MEMBER_TEMPLATE,
              botChampionId: bot.championId,
              botDifficulty: bot.difficulty,
              botId: `Bot_${bot.championId}`,
              botPosition: bot.position,
              botUuid: bot.uuid,
              isBot: true,
              teamId: team,
            },
          ]
        : []
    })

    return [...players, ...bots]
  }

  // Whether a custom game's team has a free seat
  #hasCustomSeat(team: 100 | 200): boolean {
    const { lobby } = this.#state

    return Boolean(lobby?.custom) && this.#customTeamDto(team).length < (lobby?.custom?.teamSize ?? 0)
  }

  #invitationsDto(): Record<string, unknown>[] {
    const local = {
      invitationId: '',
      invitationType: 'invalid',
      state: 'Accepted',
      timestamp: '0',
      toPuuid: this.#local.puuid,
      toSummonerId: this.#local.summonerId,
      toSummonerName: '',
    }
    const sent = (this.#state.lobby?.invitations ?? []).map((invitation) => {
      const person = this.#findPerson(invitation.summonerId)

      return {
        invitationId: `sim-${invitation.summonerId}`,
        invitationType: 'lobby',
        state: invitation.state,
        timestamp: String(invitation.acceptAt - INVITE_ACCEPT_MS),
        toPuuid: person?.puuid ?? '',
        toSummonerId: invitation.summonerId,
        toSummonerName: person?.gameName ?? '',
      }
    })

    return [local, ...sent]
  }

  #readyCheckDto(): Record<string, unknown> | null {
    const { readyCheck } = this.#state

    if (!readyCheck) {
      return null
    }

    const now = Date.now()
    const isEveryoneReady = readyCheck.acceptedAt !== null && now - readyCheck.acceptedAt >= EVERYONE_READY_MS

    return {
      declinerIds: [],
      dodgeWarning: 'None',
      playerResponse: readyCheck.response,
      state: isEveryoneReady ? 'EveryoneReady' : 'InProgress',
      suppressUx: false,
      timer: Math.min(READY_CHECK_TIMEOUT_SECONDS, (now - readyCheck.poppedAt) / 1000),
    }
  }

  #searchDto(): SimResponse {
    const { lobby, search } = this.#state

    if (!search || !lobby) {
      return { content: { errorCode: 'RPC_ERROR', httpStatus: 404, message: 'No matchmaking search exists.' }, status: 404 }
    }

    const readyCheck = this.#readyCheckDto()

    return ok({
      dodgeData: { dodgerId: 0, state: 'Invalid' },
      errors: [],
      estimatedQueueTime: 95.4,
      isCurrentlyInQueue: true,
      lobbyId: lobby.partyId,
      lowPriorityData: LOW_PRIORITY_DATA,
      queueId: lobby.queueId,
      readyCheck: readyCheck ?? {
        declinerIds: [],
        dodgeWarning: 'None',
        playerResponse: 'None',
        state: 'Invalid',
        suppressUx: false,
        timer: 0,
      },
      searchState: readyCheck ? 'Found' : 'Searching',
      timeInQueue: Math.floor((Date.now() - search.startedAt) / 1000),
    })
  }

  #summonerDto(summonerId: number): SimResponse {
    const person = this.#findPerson(summonerId)

    if (!person) {
      return this.#readCapture(LcuPaths.summoner.summoner(summonerId))
    }

    return ok({
      ...readRecord(this.#readCaptureContent(LcuPaths.summoner.currentSummoner)),
      accountId: person.summonerId,
      displayName: person.gameName,
      gameName: person.gameName,
      internalName: person.gameName,
      profileIconId: person.iconId,
      puuid: person.puuid,
      summonerId: person.summonerId,
      summonerLevel: person.level,
      tagLine: person.tagLine,
    })
  }

  #perkPages(): unknown[] {
    const pages = this.#state.perkPages ?? this.#readCaptureContent(LcuPaths.perks.pages)

    return Array.isArray(pages) ? pages : []
  }

  #setPerkPages(perkPages: unknown[]): void {
    this.#update({ perkPages })
  }

  #createLobby(queueId: number, isCustom: boolean): SimLobby {
    return {
      invitations: [],
      isCustom,
      members: [this.#createLocalMember(true)],
      partyId: crypto.randomUUID(),
      partyType: 'closed',
      queueId,
    }
  }

  #startChampSelect(now: number): void {
    const { lobby } = this.#state
    const queueId = lobby?.queueId ?? 0
    const { pickMode } = this.#queue(queueId)
    // Swift Play has no pick strategy, so the client skips champ select; shortcut: blind runs the draft until recorded
    const skipped = pickMode === ''
    const subteams = lobby ? this.#subteams(lobby) : new Map<number, [number, number]>()
    const localSubteam = subteams.get(this.#local.summonerId)?.[0]
    // Arena seats only the local player's subteam together; the rest of the party plays in other teams
    const members = (lobby?.members ?? [this.#createLocalMember(true)]).filter((member) => {
      return localSubteam === undefined || subteams.get(member.summonerId)?.[0] === localSubteam
    })
    const party = [
      ...members.filter((member) => {
        return member.summonerId === this.#local.summonerId
      }),
      ...members.filter((member) => {
        return member.summonerId !== this.#local.summonerId
      }),
    ].map((member): SimSeat => {
      const slot = readRecord(member.playerSlots[0])

      return {
        championId: skipped ? readNumber(slot.championId, 0) : 0,
        position: skipped ? readString(slot.positionPreference, 'FILL') : member.firstPosition,
        skinId: skipped ? readNumber(slot.skinId, 0) : 0,
        spell1Id: skipped ? readNumber(slot.spell1, 0) : 0,
        spell2Id: skipped ? readNumber(slot.spell2, 0) : 0,
        summonerId: member.summonerId,
      }
    })
    const isArena = this.#queue(queueId).gameMode === ARENA_GAME_MODE
    const arena = MULTITEAM_LOBBY_CONFIG[queueId] ?? ARENA_FALLBACK
    const strangers = STRANGERS.slice(0, Math.max(0, (isArena ? arena.playerSlotCount : 5) - party.length)).map(
      (person): SimSeat => {
        return { championId: 0, position: 'FILL', skinId: 0, spell1Id: 0, spell2Id: 0, summonerId: person.summonerId }
      },
    )

    if (isArena) {
      const size = readNumber(this.#queue(queueId).maximumParticipantListSize, 0)

      this.#update({
        champSelect: createArenaChampSelect({
          now,
          optionCount: DEALT_ARENA_OPTIONS[queueId] ?? 0,
          queueId,
          random: this.#random,
          seats: [...party, ...strangers],
          size: size || arena.playerSlotCount * arena.subteamCount,
          subteamSize: arena.playerSlotCount,
        }),
        readyCheck: null,
        search: null,
      })

      return
    }

    this.#update({
      champSelect: createChampSelect({
        hasCards: pickMode === ALL_RANDOM_PICK_MODE,
        now,
        queueId,
        random: this.#random,
        seats: [...party, ...strangers],
        skipped,
      }),
      readyCheck: null,
      search: null,
    })
  }

  // Champions in the queue's inventory; pickable keeps the owned and free ones
  #championIds(queueId: number, isPickable: boolean): number[] {
    const champions = this.#readCapture(LcuPaths.champions.queueChampionsMinimal(this.#local.summonerId, queueId)).content

    return Array.isArray(champions)
      ? champions.flatMap((value: unknown) => {
          const champion = readRecord(value)
          const id = readNumber(champion.id, 0)
          const isAvailable = !isPickable || readRecord(champion.ownership).owned === true || champion.freeToPlay === true

          return id > 0 && isAvailable ? [id] : []
        })
      : []
  }

  #ownedSkinIds(): number[] {
    const skins = this.#readCapture(LcuPaths.champions.inventorySkinsMinimal(this.#local.summonerId)).content

    return Array.isArray(skins)
      ? skins.flatMap((value: unknown) => {
          const skin = readRecord(value)

          return readRecord(skin.ownership).owned === true ? [readNumber(skin.id, 0)] : []
        })
      : []
  }

  // A champ select request: 204 once applied, or the LCU's refusal
  #changeChampSelect(change: (champSelect: SimChampSelect) => SimChampSelect | null): SimResponse {
    const { champSelect } = this.#state
    const next = champSelect ? change(champSelect) : null

    if (!next) {
      return INVALID_ACTION
    }

    this.#update({ champSelect: next })

    return NO_CONTENT
  }

  #patchAction(actionId: number, body: unknown): SimResponse {
    const { champSelect } = this.#state
    const request = readRecord(body)
    const next = champSelect
      ? patchLocalAction(champSelect, {
          actionId,
          championId: typeof request.championId === 'number' ? request.championId : null,
          completed: request.completed === true,
          now: Date.now(),
          random: this.#random,
        })
      : null

    if (!next) {
      return INVALID_ACTION
    }

    this.#update({ champSelect: next })

    return NO_CONTENT
  }

  #createRoutes(): SimRoute[] {
    const { DELETE, GET, PATCH, POST, PUT } = LcuHttpMethod
    const route = (method: string, pattern: RegExp, handle: SimRoute['handle']): SimRoute => {
      return { handle, method, pattern }
    }
    const withLobby = (handle: (lobby: NonNullable<SimState['lobby']>) => SimResponse) => {
      return () => {
        const { game, lobby } = this.#state

        return lobby && !game ? handle(lobby) : NOT_FOUND
      }
    }
    const setLocalMember = (change: (member: SimMember) => SimMember): SimResponse => {
      this.#updateMembers((member) => {
        return member.summonerId === this.#local.summonerId ? change(member) : member
      })

      return NO_CONTENT
    }

    return [
      route(GET, /^\/lol-chat\/v1\/friends$/, () => {
        const friends = this.#readCaptureContent(LcuPaths.social.friends)

        return ok(livenFriends(Array.isArray(friends) ? friends : []))
      }),
      // The client writes it whole, which the PUT fallback keeps as an override
      route(GET, /^\/lol-chat\/v1\/settings$/, () => {
        const { settings } = LcuPaths.social

        return ok({
          ...CHAT_SETTINGS,
          ...readRecord(this.#readCaptureContent(settings)),
          ...readRecord(this.#state.overrides[settings]),
        })
      }),
      route(GET, /^\/lol-chat\/v1\/conversations$/, () => {
        return ok(
          this.#conversations().map((conversation) => {
            return conversationDto(this.#state.chat, conversation)
          }),
        )
      }),
      route(GET, /^\/lol-clash\/v1\/player\/chat-rosters$/, () => {
        return ok(this.#state.chat.clash ? [CLASH_ROSTER] : [])
      }),
      // The Clash team's chat holds the player and their teammates
      route(GET, /^\/lol-chat\/v1\/conversations\/(?<id>[^/]+)\/participants$/, ({ id = '' }) => {
        const conversation = this.#findConversation(decodeURIComponent(id))

        if (!conversation) {
          return NOT_FOUND
        }

        return ok(conversation.type === 'clash' ? [this.#local, ...this.#clashTeammates()].map(participantDto) : [])
      }),
      // The chat on screen: its unread count clears, and the friend's next messages don't count
      route(GET, /^\/lol-chat\/v1\/conversations\/active$/, () => {
        const { active } = this.#state.chat

        return active ? ok({ id: active }) : NOT_FOUND
      }),
      route(PUT, /^\/lol-chat\/v1\/conversations\/active$/, (_, body) => {
        const id = readString(readRecord(body).id, '')
        const { chat } = this.#state

        if (!this.#findConversation(id)) {
          return NOT_FOUND
        }

        this.#update({ chat: { ...chat, active: id, unread: { ...chat.unread, [id]: 0 } } })

        return NO_CONTENT
      }),
      route(DELETE, /^\/lol-chat\/v1\/conversations\/active$/, () => {
        const { active: _, ...chat } = this.#state.chat

        this.#update({ chat })

        return NO_CONTENT
      }),
      // The client opens a chat with a friend who has none: { id: their pid, type: 'chat' }
      route(POST, /^\/lol-chat\/v1\/conversations$/, (_, body) => {
        const id = readString(readRecord(body).id, '')
        const { chat } = this.#state

        if (!id) {
          return INVALID_ACTION
        }

        if (!this.#findConversation(id)) {
          this.#update({
            chat: { ...chat, conversations: [...chat.conversations, id], messages: { ...chat.messages, [id]: [] } },
          })
        }

        const conversation = this.#findConversation(id)

        return conversation ? ok(conversationDto(this.#state.chat, conversation)) : NOT_FOUND
      }),
      route(GET, /^\/lol-chat\/v1\/conversations\/(?<id>[^/]+)\/messages$/, ({ id = '' }) => {
        const conversation = this.#findConversation(decodeURIComponent(id))

        return conversation ? ok(readMessages(this.#state.chat, conversation).map(messageDto)) : NOT_FOUND
      }),
      route(POST, /^\/lol-chat\/v1\/conversations\/(?<id>[^/]+)\/messages$/, ({ id = '' }, body) => {
        const conversationId = decodeURIComponent(id)
        const conversation = this.#findConversation(conversationId)
        const text = readString(readRecord(body).body, '').trim()

        if (!conversation || !text) {
          return NOT_FOUND
        }

        const now = Date.now()
        const message = { body: text, fromPid: this.#localPid(), id: `${now}:local`, timestamp: now }
        const chat = appendMessage(this.#state.chat, conversation, message)
        const replies =
          conversation.type === 'chat' || conversation.type === 'clash'
            ? [...chat.replies, { conversationId, dueAt: now + REPLY_MS }]
            : chat.replies

        this.#update({ chat: { ...chat, replies } })

        return ok(messageDto(message))
      }),
      // The client's "Add folder": the next id, under the meta groups' 10000s, with the priority it asks for
      route(POST, /^\/lol-chat\/v1\/friend-groups$/, (_, body) => {
        const name = readString(readRecord(body).name, '').trim()
        const current = this.#get(LcuPaths.social.friendGroups).content
        const groups = Array.isArray(current) ? current : []

        if (!name) {
          return { content: { errorCode: 'RPC_ERROR', httpStatus: 400, message: 'Invalid group name' }, status: 400 }
        }

        const ids = groups
          .map((group) => {
            return readNumber(readRecord(group).id, 0)
          })
          .filter((id) => {
            return id < 10_000
          })
        const group = {
          collapsed: false,
          id: Math.max(0, ...ids) + 1,
          isLocalized: false,
          isMetaGroup: false,
          name,
          priority: readNumber(readRecord(body).priority, 0),
        }

        this.#update({ overrides: { ...this.#state.overrides, [LcuPaths.social.friendGroups]: [...groups, group] } })

        return NO_CONTENT
      }),
      route(GET, /^\/lol-chat\/v2\/friend-requests$/, () => {
        return ok(this.#state.chat.friendRequests.map(friendRequestDto))
      }),
      route(POST, /^\/lol-chat\/v2\/friend-requests$/, (_, body) => {
        const recentlyPlayed = this.#readCaptureContent(LcuPaths.matchHistory.recentPlayers)
        const request = readFriendRequest(body, Array.isArray(recentlyPlayed) ? recentlyPlayed : [])
        const { chat } = this.#state

        if (!request) {
          return { content: { errorCode: 'RPC_ERROR', httpStatus: 400, message: 'Invalid friend request' }, status: 400 }
        }

        this.#update({ chat: { ...chat, friendRequests: [...chat.friendRequests, request] } })

        return NO_CONTENT
      }),
      route(GET, /^\/lol-gameflow\/v1\/gameflow-phase$/, () => {
        return ok(this.phase)
      }),
      route(GET, /^\/lol-gameflow\/v1\/session$/, () => {
        const session = readRecord(this.#readCaptureContent(LcuPaths.gameflow.session))
        const gameData = readRecord(session.gameData)
        const { lobby } = this.#state
        // The lobby stays in the state, hidden, through the game
        const queue = lobby ? { ...readRecord(gameData.queue), ...this.#queue(lobby.queueId) } : readRecord(gameData.queue)

        return ok({ ...session, gameData: { ...gameData, queue }, phase: this.phase })
      }),
      route(GET, /^\/lol-lobby\/v2\/lobby$/, () => {
        return this.#lobbyDto()
      }),
      route(
        GET,
        /^\/lol-lobby\/v1\/lobby\/members\/localMember\/player-slots$/,
        withLobby((lobby) => {
          const local = lobby.members.find((member) => {
            return member.summonerId === this.#local.summonerId
          })

          return ok(local?.playerSlots ?? [])
        }),
      ),
      route(
        GET,
        /^\/lol-lobby\/v2\/lobby\/invitations$/,
        withLobby(() => {
          return ok(this.#invitationsDto())
        }),
      ),
      route(GET, /^\/lol-lobby\/v2\/notifications$/, () => {
        return ok(this.#state.lobbyNotifications)
      }),
      route(GET, /^\/lol-lobby\/v2\/received-invitations$/, () => {
        return ok(
          this.#state.receivedInvitations.map((invitation) => {
            const from = this.#findPerson(invitation.fromSummonerId)
            const queue = this.#queue(invitation.queueId)

            return {
              canAcceptInvitation: true,
              fromSummonerId: invitation.fromSummonerId,
              fromSummonerName: from?.gameName ?? '',
              gameConfig: {
                gameMode: readString(queue.gameMode, 'CLASSIC'),
                inviteGameType: 'normal',
                mapId: readNumber(queue.mapId, 11),
                queueId: invitation.queueId,
              },
              invitationId: invitation.invitationId,
              invitationType: 'lobby',
              restrictions: [],
              state: 'Pending',
              timestamp: String(invitation.timestamp),
            }
          }),
        )
      }),
      route(GET, /^\/lol-matchmaking\/v1\/search$/, () => {
        return this.#searchDto()
      }),
      route(GET, /^\/lol-lobby\/v2\/lobby\/matchmaking\/search-state$/, () => {
        const search = this.#searchDto()

        return ok({
          errors: [],
          lowPriorityData: LOW_PRIORITY_DATA,
          searchState: search.status === 200 ? readRecord(search.content).searchState : 'Invalid',
        })
      }),
      route(GET, /^\/lol-matchmaking\/v1\/ready-check$/, () => {
        const readyCheck = this.#readyCheckDto()

        return readyCheck
          ? ok(readyCheck)
          : {
              content: { errorCode: 'RPC_ERROR', httpStatus: 404, message: 'Not attached to a matchmaking queue.' },
              status: 404,
            }
      }),
      route(GET, /^\/lol-champ-select\/v1\/session$/, () => {
        const { champSelect } = this.#state

        return champSelect
          ? ok(
              champSelectSessionDto(champSelect, (summonerId) => {
                return this.#findPerson(summonerId)
              }),
            )
          : NOT_FOUND
      }),
      route(GET, /^\/lol-champ-select\/v1\/(?<list>pickable|bannable)-champion-ids$/, ({ list }) => {
        const { champSelect } = this.#state

        if (!champSelect) {
          return NOT_FOUND
        }

        const local = champSelect.cells.find((cell) => {
          return cell.cellId === champSelect.localCellId
        })
        const dealt = champSelect.subteamSize ? (local?.cards ?? []) : []

        // Arena de Valentía: only the champions dealt, both lists
        return ok(dealt.length > 0 ? dealt : this.#championIds(champSelect.queueId, list === 'pickable'))
      }),
      route(GET, /^\/lol-champ-select\/v1\/pickable-skin-ids$/, () => {
        return this.#state.champSelect ? ok(this.#ownedSkinIds()) : NOT_FOUND
      }),
      // ARAM: the local player's cards, until champ select ends
      route(GET, /^\/lol-lobby-team-builder\/champ-select\/v1\/subset-champion-list$/, () => {
        const { champSelect } = this.#state
        const cell = champSelect?.cells.find((candidate) => {
          return candidate.cellId === champSelect.localCellId
        })

        return champSelect?.hasCards && cell ? ok(cell.cards) : NOT_FOUND
      }),
      route(POST, /^\/lol-champ-select\/v1\/session\/bench\/swap\/(?<id>\d+)$/, ({ id }) => {
        return this.#changeChampSelect((champSelect) => {
          return swapLocalWithBench(champSelect, Number(id), Date.now())
        })
      }),
      route(GET, /^\/lol-champ-select\/v1\/ongoing-champion-swap$/, () => {
        const swap = this.#state.champSelect ? ongoingSwapDto(this.#state.champSelect) : null

        return swap ? ok(swap) : NOT_FOUND
      }),
      route(
        POST,
        /^\/lol-champ-select\/v1\/session\/champion-swaps\/(?<id>\d+)\/(?<method>request|accept|decline|cancel)$/,
        ({ id, method }) => {
          return this.#changeChampSelect((champSelect) => {
            if (method === 'request') {
              return requestLocalSwap(champSelect, { id: Number(id), now: Date.now() }, this.#random)
            }

            return method === 'accept' || method === 'decline' || method === 'cancel'
              ? answerLocalSwap(champSelect, { id: Number(id), now: Date.now() }, method)
              : null
          })
        },
      ),
      route(POST, /^\/lol-champ-select\/v1\/ongoing-champion-swap\/(?<id>\d+)\/clear$/, ({ id }) => {
        return this.#changeChampSelect((champSelect) => {
          return clearLocalSwap(champSelect, { id: Number(id), now: Date.now() })
        })
      }),
      route(PATCH, /^\/lol-champ-select\/v1\/session\/actions\/(?<id>\d+)$/, ({ id }, body) => {
        return this.#patchAction(Number(id), body)
      }),
      route(POST, /^\/lol-champ-select\/v1\/session\/actions\/(?<id>\d+)\/complete$/, ({ id }) => {
        return this.#patchAction(Number(id), { completed: true })
      }),
      route(PATCH, /^\/lol-champ-select\/v1\/session\/my-selection$/, (_groups, body) => {
        const { champSelect } = this.#state

        if (!champSelect) {
          return NOT_FOUND
        }

        this.#update({ champSelect: patchLocalSelection(champSelect, readRecord(body), Date.now()) })

        return NO_CONTENT
      }),
      route(PATCH, /^\/lol-loadouts\/v4\/loadouts\/(?<id>[^/]+)$/, ({ id }, body) => {
        const path = LcuPaths.loadouts.account
        const loadouts = this.#get(path).content

        if (!Array.isArray(loadouts)) {
          return NOT_FOUND
        }

        const changes = readRecord(readRecord(body).loadout)

        this.#update({
          overrides: {
            ...this.#state.overrides,
            [path]: loadouts.map((loadout: unknown) => {
              const current = readRecord(loadout)

              return current.id === id ? { ...current, loadout: { ...readRecord(current.loadout), ...changes } } : loadout
            }),
          },
        })

        return NO_CONTENT
      }),
      route(GET, /^\/liveclientdata\/gamestats$/, () => {
        const { game, lobby } = this.#state
        const queue = this.#queue(lobby?.queueId ?? 0)

        // The game's own API, up only while it runs
        return game?.phase === 'InProgress'
          ? ok({
              gameMode: readString(queue.gameMode, 'CLASSIC'),
              gameTime: (Date.now() - game.startedAt) / 1000,
              mapName: 'Map11',
              mapNumber: readNumber(queue.mapId, 11),
              mapTerrain: 'Default',
            })
          : NOT_FOUND
      }),
      route(GET, /^\/lol-summoner\/v1\/summoners\/(?<id>\d+)$/, ({ id }) => {
        return this.#summonerDto(Number(id))
      }),
      route(GET, /^\/lol-perks\/v1\/pages$/, () => {
        return ok(this.#perkPages())
      }),
      route(GET, /^\/lol-perks\/v1\/currentpage$/, () => {
        const pages = this.#perkPages()
        const current = pages.find((page) => {
          return readRecord(page).current === true
        })

        return current ? ok(current) : this.#readCapture(LcuPaths.perks.currentPage)
      }),
      route(GET, /^\/lol-lobby\/v2\/ags\/(?<activityId>[^/]+)\/joinCode$/, ({ activityId = '' }) => {
        const joinCode = this.#state.joinCodes[decodeURIComponent(activityId)]

        return joinCode ? ok(joinCode) : NOT_FOUND
      }),

      route(POST, /^\/lol-lobby\/v2\/lobby$/, (_groups, body) => {
        const request = readRecord(body)
        const queueId = readNumber(request.queueId, 0)
        const isCustom = readBoolean(request.isCustom, false)
        const customGame = readRecord(request.customGameLobby)
        const configuration = readRecord(customGame.configuration)
        const custom = isCustom
          ? {
              bots: [],
              mutatorName: CUSTOM_MUTATOR_NAMES[readNumber(readRecord(configuration.mutators).id, 0)] ?? '',
              name: readString(customGame.lobbyName, 'Custom Game'),
              teamSize: readNumber(configuration.teamSize, 5),
            }
          : undefined
        const { lobby } = this.#state

        this.#update({
          champSelect: null,
          game: null,
          lobby: { ...(lobby ?? this.#createLobby(queueId, isCustom)), custom, isCustom, queueId },
          readyCheck: null,
          search: null,
        })

        return this.#lobbyDto()
      }),
      // The end-of-game screen left without Play Again: back home, the party gone
      route(POST, /^\/lol-end-of-game\/v1\/state\/dismiss-stats$/, () => {
        const { game } = this.#state

        if (game && game.phase !== 'GameStart' && game.phase !== 'InProgress') {
          this.#update({ game: null, lobby: null })
        }

        return NO_CONTENT
      }),
      route(DELETE, /^\/lol-lobby\/v2\/notifications\/(?<id>[^/]+)$/, ({ id = '' }) => {
        const { lobbyNotifications } = this.#state
        const remaining = lobbyNotifications.filter(({ notificationId }) => {
          return notificationId !== decodeURIComponent(id)
        })

        if (remaining.length === lobbyNotifications.length) {
          return NOT_FOUND
        }

        this.#update({ lobbyNotifications: remaining })

        return NO_CONTENT
      }),
      route(DELETE, /^\/lol-lobby\/v2\/lobby$/, () => {
        this.#update({ champSelect: null, game: null, lobby: null, readyCheck: null, search: null })

        return NO_CONTENT
      }),
      // The v1 one is a custom game's
      route(PUT, /^\/lol-lobby\/v[12]\/lobby\/members\/localMember\/position-preferences$/, (_groups, body) => {
        const preferences = readRecord(body)

        return setLocalMember((member) => {
          return {
            ...member,
            firstPosition: readString(preferences.firstPreference, member.firstPosition),
            secondPosition: readString(preferences.secondPreference, member.secondPosition),
          }
        })
      }),
      route(PUT, /^\/lol-lobby\/v1\/lobby\/members\/localMember\/player-slots$/, (_groups, body) => {
        return setLocalMember((member) => {
          return { ...member, playerSlots: Array.isArray(body) ? body : member.playerSlots }
        })
      }),
      // Arena's swap: the local player takes the slot, and whoever sat there takes theirs. 0, 0 clears it
      route(PUT, /^\/lol-lobby\/v2\/lobby\/subteamData$/, (_groups, body) => {
        const { lobby } = this.#state
        const { intraSubteamPosition, subteamIndex } = readRecord(body)
        const target: [number, number] = [readNumber(subteamIndex, 0), readNumber(intraSubteamPosition, 0)]

        if (!lobby || !MULTITEAM_LOBBY_CONFIG[lobby.queueId]) {
          return NOT_FOUND
        }

        const subteams = this.#subteams(lobby)
        const current = subteams.get(this.#local.summonerId)
        const occupant = [...subteams].find(([, slot]) => {
          return slot.join(',') === target.join(',')
        })?.[0]

        this.#updateMembers((member) => {
          if (member.summonerId === this.#local.summonerId) {
            return { ...member, subteam: target }
          }

          return member.summonerId === occupant
            ? { ...member, subteam: current }
            : { ...member, subteam: subteams.get(member.summonerId) }
        })

        return NO_CONTENT
      }),
      route(PUT, /^\/lol-lobby\/v2\/lobby\/quickplayMemberData$/, (_groups, body) => {
        return setLocalMember((member) => {
          return { ...member, isReady: readRecord(body).isPlayerReady === 'true' }
        })
      }),
      route(GET, /^\/lol-lobby\/v2\/lobby\/custom\/available-bots$/, () => {
        return ok(
          SIM_BOTS.map(([id]) => {
            return { active: true, botDifficulties: ['RSINTRO', 'RSBEGINNER', 'RSINTERMEDIATE'], id, name: '' }
          }),
        )
      }),
      route(GET, /^\/lol-perks\/v1\/recommended-champion-positions$/, () => {
        // A capture has every champion's lanes; without one, the bots' and the drafts' pick pools
        const captured = this.#readCaptureContent(LcuPaths.perks.recommendedChampionPositions)
        const positions: Record<number, { recommendedPositions: string[] }> = {}

        for (const [id, lane] of [...SIM_BOTS, ...SIM_PICK_LANES]) {
          const lanes = (positions[id] ??= { recommendedPositions: [] }).recommendedPositions

          if (!lanes.includes(lane)) {
            lanes.push(lane)
          }
        }

        return ok(captured ?? positions)
      }),
      route(POST, /^\/lol-lobby\/v1\/lobby\/custom\/bots$/, (_groups, body) => {
        const { lobby } = this.#state
        const bot = readRecord(body)
        const team = readString(bot.teamId, '100') === '200' ? 200 : 100

        if (!lobby?.custom || !this.#hasCustomSeat(team)) {
          return INVALID_ACTION
        }

        const added = {
          championId: readNumber(bot.championId, 0),
          difficulty: readString(bot.botDifficulty, 'NONE'),
          position: readString(bot.position, 'TOP'),
          team,
          uuid: readString(bot.botUuid, crypto.randomUUID()),
        } satisfies SimBot

        this.#update({ lobby: { ...lobby, custom: { ...lobby.custom, bots: [...lobby.custom.bots, added] } } })

        return NO_CONTENT
      }),
      route(POST, /^\/lol-lobby\/v2\/lobby\/team\/(?<team>TEAM1|TEAM2)$/, ({ team }) => {
        const teamId = team === 'TEAM2' ? 200 : 100

        if (!this.#hasCustomSeat(teamId)) {
          return INVALID_ACTION
        }

        return setLocalMember((member) => {
          return { ...member, team: teamId }
        })
      }),
      route(POST, /^\/lol-lobby\/v1\/lobby\/custom\/start-champ-select$/, () => {
        if (!this.#state.lobby?.custom) {
          return NOT_FOUND
        }

        this.#startChampSelect(Date.now())

        return NO_CONTENT
      }),
      route(PUT, /^\/lol-lobby\/v2\/lobby\/partyType$/, (_groups, body) => {
        const { lobby } = this.#state

        if (!lobby) {
          return NOT_FOUND
        }

        this.#update({ lobby: { ...lobby, partyType: readString(body, lobby.partyType) } })

        return NO_CONTENT
      }),
      route(
        POST,
        /^\/lol-lobby\/v2\/lobby\/members\/(?<id>\d+)\/(?<action>kick|promote|grant-invite|revoke-invite)$/,
        ({ action, id }) => {
          const { lobby } = this.#state
          const summonerId = Number(id)

          if (!lobby) {
            return NOT_FOUND
          }

          if (action === 'kick') {
            this.#update({ lobby: this.#withoutMember(lobby, summonerId) })
          } else if (action === 'promote') {
            this.#updateMembers((member) => {
              return { ...member, isLeader: member.summonerId === summonerId }
            })
          } else {
            this.#updateMembers((member) => {
              return member.summonerId === summonerId ? { ...member, canInvite: action === 'grant-invite' } : member
            })
          }

          return NO_CONTENT
        },
      ),
      route(POST, /^\/lol-lobby\/v2\/lobby\/invitations$/, (_groups, body) => {
        const { lobby } = this.#state

        if (!lobby || !Array.isArray(body)) {
          return NOT_FOUND
        }

        const acceptAt = Date.now() + INVITE_ACCEPT_MS
        const invited = body.flatMap((value: unknown) => {
          const summonerId = readNumber(readRecord(value).toSummonerId, 0)

          return summonerId > 0 ? [{ acceptAt, state: 'Pending', summonerId }] : []
        })

        this.#update({ lobby: { ...lobby, invitations: [...lobby.invitations, ...invited] } })

        return ok(body)
      }),
      route(POST, /^\/lol-lobby\/v2\/lobby\/matchmaking\/search$/, () => {
        if (!this.#state.lobby) {
          return NOT_FOUND
        }

        this.#update({ search: { popAt: this.#nextPopAt(), startedAt: Date.now() } })

        return NO_CONTENT
      }),
      route(DELETE, /^\/lol-lobby\/v2\/lobby\/matchmaking\/search$/, () => {
        this.#update({ readyCheck: null, search: null })

        return NO_CONTENT
      }),
      route(POST, /^\/lol-matchmaking\/v1\/ready-check\/(?<answer>accept|decline)$/, ({ answer }) => {
        const { readyCheck } = this.#state

        if (!readyCheck) {
          return NOT_FOUND
        }

        if (answer === 'accept') {
          this.#update({ readyCheck: { ...readyCheck, acceptedAt: Date.now(), response: 'Accepted' } })
        } else {
          this.#update({ readyCheck: null, search: null })
        }

        return NO_CONTENT
      }),
      route(POST, /^\/lol-lobby\/v2\/received-invitations\/(?<id>[^/]+)\/(?<answer>accept|decline)$/, ({ answer, id = '' }) => {
        const invitationId = decodeURIComponent(id)
        const invitation = this.#state.receivedInvitations.find((candidate) => {
          return candidate.invitationId === invitationId
        })

        if (!invitation) {
          return NOT_FOUND
        }

        const receivedInvitations = this.#state.receivedInvitations.filter((candidate) => {
          return candidate !== invitation
        })
        const leader = this.#findPerson(invitation.fromSummonerId)

        if (answer === 'decline' || !leader) {
          this.#update({ receivedInvitations })

          return NO_CONTENT
        }

        this.#update({
          champSelect: null,
          game: null,
          lobby: {
            invitations: [],
            isCustom: false,
            members: [{ ...this.#createMember(leader, 1), isLeader: true }, this.#createLocalMember(false)],
            partyId: crypto.randomUUID(),
            partyType: 'closed',
            queueId: invitation.queueId,
          },
          readyCheck: null,
          receivedInvitations,
          search: null,
        })

        return NO_CONTENT
      }),
      route(POST, /^\/lol-lobby\/v2\/ags\/(?<id>[^/]+)\/joinCode$/, ({ id = '' }) => {
        const activityId = decodeURIComponent(id)
        const joinCode = {
          expiresAt: Date.now() + 3_600_000,
          isActive: true,
          joinCode: 'SIM4242',
          smartUrl: 'https://lol.sim/join/SIM4242',
        }

        this.#update({ joinCodes: { ...this.#state.joinCodes, [activityId]: joinCode } })

        return ok(joinCode)
      }),
      route(POST, /^\/lol-perks\/v1\/pages$/, (_groups, body) => {
        const pages = this.#perkPages()
        const id =
          Math.max(
            0,
            ...pages.map((page) => {
              return readNumber(readRecord(page).id, 0)
            }),
          ) + 1
        const page = { ...readRecord(body), current: true, id, isDeletable: true, isEditable: true }

        this.#setPerkPages([
          ...pages.map((existing) => {
            return { ...readRecord(existing), current: false }
          }),
          page,
        ])

        return ok(page)
      }),
      route(PUT, /^\/lol-perks\/v1\/pages\/(?<pageId>\d+)$/, ({ pageId }, body) => {
        const id = Number(pageId)

        this.#setPerkPages(
          this.#perkPages().map((page) => {
            return readRecord(page).id === id ? { ...readRecord(page), ...readRecord(body), id } : page
          }),
        )

        return NO_CONTENT
      }),
      route(DELETE, /^\/lol-perks\/v1\/pages\/(?<pageId>\d+)$/, ({ pageId }) => {
        const id = Number(pageId)

        this.#setPerkPages(
          this.#perkPages().filter((page) => {
            return readRecord(page).id !== id
          }),
        )

        return NO_CONTENT
      }),
      route(PUT, /^\/lol-perks\/v1\/currentpage$/, (_groups, body) => {
        const id = readNumber(body, -1)

        this.#setPerkPages(
          this.#perkPages().map((page) => {
            return { ...readRecord(page), current: readRecord(page).id === id }
          }),
        )

        return NO_CONTENT
      }),
    ]
  }
}
