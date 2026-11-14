import { communityDragonGameDataUrl } from '@/core/http/ddragon'

import type { CreateLobbyCategory, CreateLobbyOption, GameMode, ModeIcon } from './create-lobby-types'
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

export function getCategoryQueues(
  modes: GameMode[],
  category: CreateLobbyCategory,
  pvpModeId: string | undefined,
): GameQueue[] {
  const modeId = category === 'pvp' ? pvpModeId : category

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

function optionalAssetUrl(lcuPath: string | undefined): string | undefined {
  return lcuPath ? communityDragonGameDataUrl(lcuPath) : undefined
}

// The client draws each mode with the assets of its map and game mode (/lol-maps); the first queue with an icon wins
export function getModeIcon(mode: GameMode, maps: GameMap[]): ModeIcon | undefined {
  for (const queue of mode.queues) {
    const assets = maps.find((map) => {
      return map.id === queue.mapId && map.gameMode === queue.gameMode
    })?.assets
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
