import { communityDragonGameDataUrl } from '@/core/http/ddragon'

import type {
  AramMapOption,
  CreateLobbyCategory,
  CreateLobbyOption,
  CreateLobbySelection,
  CustomGameForm,
  GameMode,
  ModeIcon,
} from './create-lobby-types'
import type { GameQueue } from '@/core/lcu/parsers/game-queues'
import type { GameMap } from '@/core/lcu/parsers/maps'
import type { LcuLobbyCustomBody, LcuLobbyQueueBody } from '@shoma/protocol-contract'

// The body the live client accepted (2026-11); without queueId 3140 and mutator 19 it answers 500 INVALID_LOBBY
export const PRACTICE_TOOL_LOBBY: LcuLobbyCustomBody = {
  customGameLobby: {
    configuration: {
      gameMode: 'PRACTICETOOL',
      gameMutator: '',
      gameServerRegion: '',
      mapId: 11,
      mutators: { id: 19 },
      spectatorPolicy: 'AllAllowed',
      teamSize: 5,
    },
    lobbyName: 'Practice Tool',
    lobbyPassword: '',
  },
  isCustom: true,
  queueId: 3140,
}

// The random ARAM map, which the client sends as no mutator ('' reads as no selection to Base UI's Select)
export const RANDOM_ARAM_MAP = 'random'

// As the Figma fills the form; the client itself defaults spectators to none
export const DEFAULT_CUSTOM_GAME_FORM: CustomGameForm = {
  aramMapMutator: RANDOM_ARAM_MAP,
  name: null,
  password: '',
  spectatorDelayEnabled: true,
  spectatorPolicy: 'LobbyAllowed',
  teamSize: 5,
}

export function parseQueueIds(rawQueueIds?: string | null) {
  if (!rawQueueIds) {
    return []
  }

  return rawQueueIds.split(',').map(Number)
}

// PvP picks a mode in its own step; co-op and training are one mode each, so their queues come straight after
export function getPvpModes(modes: GameMode[]): GameMode[] {
  return modes.filter((mode) => {
    return mode.id !== 'coop' && mode.id !== 'training'
  })
}

// PvP and custom pass their own modes and the picked one; the other categories are a mode each
export function getCategoryQueues(
  modes: GameMode[],
  category: CreateLobbyCategory,
  pickedModeId: string | undefined,
): GameQueue[] {
  const modeId = category === 'pvp' || category === 'custom' ? pickedModeId : category

  return (
    modes.find((mode) => {
      return mode.id === modeId
    })?.queues ?? []
  )
}

// Training lists the practice tool first, before its tutorial queues
export function getDefaultOption(category: CreateLobbyCategory, queues: GameQueue[]): CreateLobbyOption | undefined {
  return category === 'training' ? 'practice-tool' : queues[0]?.id
}

// The steps that lead to a lobby's queue, so changing mode starts from the current one; undefined for a queue no step lists
export function findQueueSelection(
  modes: GameMode[],
  customModes: GameMode[],
  queueId: number | null,
): CreateLobbySelection | undefined {
  if (queueId === PRACTICE_TOOL_LOBBY.queueId) {
    return { category: 'training', modeId: 'training', option: 'practice-tool' }
  }

  const mode = [...modes, ...customModes].find(({ queues }) => {
    return queues.some(({ id }) => {
      return id === queueId
    })
  })

  if (!mode || queueId === null) {
    return undefined
  }

  let category: CreateLobbyCategory = 'pvp'

  if (mode.id === 'coop' || mode.id === 'training') {
    category = mode.id
  } else if (customModes.includes(mode)) {
    category = 'custom'
  }

  return { category, modeId: mode.id, option: queueId }
}

function optionalAssetUrl(lcuPath: string | undefined): string | undefined {
  return lcuPath ? communityDragonGameDataUrl(lcuPath) : undefined
}

// The client draws a queue with the assets of its map and game mode (/lol-maps)
export function findQueueMap(queue: GameQueue, maps: GameMap[]): GameMap | undefined {
  return maps.find((map) => {
    return map.id === queue.mapId && map.gameMode === queue.gameMode
  })
}

// The first queue with an icon wins
export function getModeIcon(mode: GameMode, maps: GameMap[]): ModeIcon | undefined {
  for (const queue of mode.queues) {
    const assets = findQueueMap(queue, maps)?.assets
    const still = assets?.['game-select-icon-default']
    const active = assets?.['game-select-icon-active']

    if (still && active) {
      return {
        active: communityDragonGameDataUrl(active),
        activeVideo: optionalAssetUrl(assets['game-select-icon-active-video']),
        default: communityDragonGameDataUrl(still),
        introVideo: optionalAssetUrl(assets['game-select-icon-intro-video']),
      }
    }
  }

  return undefined
}

export function getCreateLobbyBody(option: CreateLobbyOption): LcuLobbyCustomBody | LcuLobbyQueueBody {
  return option === 'practice-tool' ? PRACTICE_TOOL_LOBBY : { queueId: option }
}

// A custom game is its queue (map, mode and pick strategy) plus the form; null for a queue without a pick strategy
export function getCustomLobbyBody(queue: GameQueue, form: CustomGameForm, lobbyName: string): LcuLobbyCustomBody | null {
  if (!queue.gameTypeConfig) {
    return null
  }

  return {
    customGameLobby: {
      configuration: {
        ...(queue.gameMode === 'ARAM'
          ? { aramMapMutator: form.aramMapMutator === RANDOM_ARAM_MAP ? '' : form.aramMapMutator }
          : {}),
        gameMode: queue.gameMode,
        gameMutator: '',
        gameServerRegion: '',
        mapId: queue.mapId,
        mutators: { id: queue.gameTypeConfig.id },
        spectatorDelayEnabled: form.spectatorDelayEnabled,
        spectatorPolicy: form.spectatorPolicy,
        teamSize: form.teamSize,
      },
      lobbyName: lobbyName.trim(),
      lobbyPassword: form.password,
    },
    isCustom: true,
    queueId: queue.id,
  }
}

function getCustomModeId(queue: GameQueue): string | undefined {
  if (queue.mapId === 11 && queue.gameMode === 'CLASSIC') {
    return 'sr'
  }

  if (queue.mapId === 453 && queue.gameMode === 'JADE') {
    return 'classic'
  }

  if (queue.mapId === 12 && (queue.gameMode === 'ARAM' || queue.gameMode.startsWith('KIWI'))) {
    return 'aram'
  }

  return undefined
}

// Figma "Create Custom" maps: the client's open custom queues, one per map and pick strategy. The practice tool is Training.
// Their ids differ from the PvP modes' so the tiles show no team size: the form picks it
export function groupCustomQueuesByMode(queues: GameQueue[]): GameMode[] {
  const modes: GameMode[] = [
    { id: 'custom-sr', nameKey: 'createLobby.modes.sr', queues: [] },
    { id: 'custom-classic', nameKey: 'createLobby.modes.classic', queues: [] },
    { id: 'custom-aram', nameKey: 'createLobby.modes.randomMap', queues: [] },
  ]
  const openQueues = queues
    .filter((queue) => {
      return queue.category === 'Custom' && queue.queueAvailability === 'Available' && queue.isEnabled
    })
    .toSorted((a, b) => {
      return a.id - b.id
    })

  for (const queue of openQueues) {
    const modeId = getCustomModeId(queue)

    modes
      .find((mode) => {
        return mode.id === `custom-${modeId}`
      })
      ?.queues.push(queue)
  }

  return modes.filter((mode) => {
    return mode.queues.length > 0
  })
}

const GAME_TYPE_KEYS = new Map([
  [6, 'createLobby.gameTypes.tournament'],
  [18, 'createLobby.gameTypes.draft'],
  [19, 'createLobby.gameTypes.blind'],
  [21, 'createLobby.gameTypes.allRandom'],
])

// The client names custom queues "<map> (<pick strategy>)"; a mode of its own, like ARAM: Mayhem, keeps its name
export function getGameTypeKey(queue: GameQueue): string | undefined {
  const isMapsOwnMode = queue.gameMode === 'CLASSIC' || queue.gameMode === 'ARAM' || queue.gameMode === 'JADE'

  return isMapsOwnMode && queue.gameTypeConfig ? GAME_TYPE_KEYS.get(queue.gameTypeConfig.id) : undefined
}

// Figma "Map type": ARAM's map skins by their client name, the random default first; same-named skins are one choice
export function getAramMapOptions(maps: GameMap[]): AramMapOption[] {
  const options: AramMapOption[] = []

  for (const map of maps) {
    const isNew = !options.some(({ label }) => {
      return label === map.name
    })

    if (map.id === 12 && map.gameMode === 'ARAM' && map.name && isNew) {
      options.push({ label: map.name, value: map.gameMutator || RANDOM_ARAM_MAP })
    }
  }

  return options
}

const ROTATING_GAME_MODES = new Set(['arurf', 'nb', 'nexusblitz', 'ofa', 'oneforall', 'ultbook', 'urf', 'usb'])

const TRAINING_GAME_MODES = new Set(['practicetool', 'tutorial', 'tutorial_module_1', 'tutorial_module_2', 'tutorial_module_3'])

export function groupQueuesByMode(queues: GameQueue[], defaultGameQueues: number[], isClashVisible = false): GameMode[] {
  const modesMap: Record<string, GameMode> = {
    aram: {
      id: 'aram',
      nameKey: 'createLobby.modes.aram',
      queues: [],
    },
    arena: {
      id: 'arena',
      nameKey: 'createLobby.modes.arena',
      queues: [],
    },
    clash: {
      id: 'clash',
      nameKey: 'createLobby.modes.clash',
      queues: [],
    },
    classic: {
      id: 'classic',
      nameKey: 'createLobby.modes.classic',
      queues: [],
    },
    coop: {
      id: 'coop',
      nameKey: 'createLobby.modes.coopVsAi',
      queues: [],
    },
    rgm: {
      id: 'rgm',
      nameKey: 'createLobby.modes.rgm',
      queues: [],
    },
    sr: {
      id: 'sr',
      nameKey: 'createLobby.modes.sr',
      queues: [],
    },
    training: {
      id: 'training',
      nameKey: 'createLobby.modes.training',
      queues: [],
    },
  }

  for (const queue of queues) {
    const gameMode = queue.gameMode.toLowerCase()
    const isCustom = queue.category === 'Custom'
    const hasNoDescription = queue.description.trim().length === 0
    const isDisabled = queue.queueAvailability === 'PlatformDisabled' || !queue.isEnabled
    const isClashQueue = queue.id === 700 || queue.id === 720
    // Ponytail: *_CLASH queues (e.g. URF_CLASH 740/741) are tournament queues, not the rotating casual mode
    const isRotatingClash = queue.type?.endsWith('_CLASH') ?? false

    if (!(isCustom || hasNoDescription || isDisabled || (isClashQueue && !isClashVisible))) {
      if (queue.category === 'VersusAi' || queue.type === 'JADE_BOT') {
        modesMap.coop.queues.push(queue)
      } else if (isClashQueue) {
        modesMap.clash.queues.push(queue)
      } else if (ROTATING_GAME_MODES.has(gameMode) && !isRotatingClash) {
        modesMap.rgm.queues.push(queue)
      } else if (TRAINING_GAME_MODES.has(gameMode)) {
        modesMap.training.queues.push(queue)
      } else if (queue.mapId === 12 && (gameMode === 'aram' || gameMode.startsWith('kiwi'))) {
        modesMap.aram.queues.push(queue)
      } else if (queue.mapId === 11 && (queue.gameMode === 'CLASSIC' || queue.gameMode === 'SWIFTPLAY')) {
        modesMap.sr.queues.push(queue)
      } else if (queue.mapId === 30 && queue.gameMode === 'CHERRY') {
        modesMap.arena.queues.push(queue)
      } else if (queue.mapId === 453 && queue.gameMode === 'JADE') {
        modesMap.classic.queues.push(queue)
      }
    }
  }

  // Ponytail: the official client swaps Arena with the active rotating mode, so both live in the Arena card
  if (modesMap.rgm.queues.length > 0) {
    modesMap.arena.queues.push(...modesMap.rgm.queues)
    modesMap.arena.nameKey = 'createLobby.modes.arenaRgm'
  }

  const modes = [
    modesMap.sr,
    modesMap.classic,
    modesMap.aram,
    modesMap.arena,
    modesMap.coop,
    modesMap.clash,
    modesMap.training,
  ].filter((mode) => {
    return mode.queues.length > 0
  })
  const defaultQueueIndex = new Map(
    defaultGameQueues.map((id, index) => {
      return [id, index]
    }),
  )

  for (const mode of modes) {
    mode.queues.sort((a, b) => {
      const aDefaultIndex = defaultQueueIndex.get(a.id)
      const bDefaultIndex = defaultQueueIndex.get(b.id)

      if (aDefaultIndex !== undefined) {
        if (bDefaultIndex !== undefined) {
          return aDefaultIndex - bDefaultIndex
        }

        return -1
      }

      if (bDefaultIndex !== undefined) {
        return 1
      }

      return 0
    })
  }

  for (const mode of modes) {
    const seenDescriptions = new Set<string>()

    mode.queues = mode.queues.filter((queue) => {
      const key = queue.description.trim().toLowerCase()

      if (seenDescriptions.has(key)) {
        return false
      }

      seenDescriptions.add(key)

      return true
    })
  }

  return modes
}
