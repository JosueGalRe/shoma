import type { GameMode } from './lobby-creation-content-types'
import type { GameQueue } from '@/core/lcu/parsers/game-queues'

const CD_CDN =
  'https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/content/src/leagueclient/gamemodeassets'

export function parseQueueIds(rawQueueIds?: string | null) {
  if (!rawQueueIds) {
    return []
  }

  return rawQueueIds.split(',').map(Number)
}
export function readModeCardId(currentMode: string | undefined): string | null {
  switch (currentMode) {
    case 'normal-draft':
    case 'ranked-flex':
    case 'ranked-solo-duo':
    case 'swiftplay': {
      return 'sr'
    }
    case 'aram':
    case 'arena':
    case 'clash': {
      return currentMode
    }
    case 'coop-vs-ai': {
      return 'coop'
    }
    default: {
      return null
    }
  }
}

const ROTATING_GAME_MODES = new Set(['arurf', 'nb', 'nexusblitz', 'ofa', 'oneforall', 'ultbook', 'urf', 'usb'])

const TRAINING_GAME_MODES = new Set(['practicetool', 'tutorial', 'tutorial_module_1', 'tutorial_module_2', 'tutorial_module_3'])

export function groupQueuesByMode(queues: GameQueue[], defaultGameQueues: number[], isClashVisible = false): GameMode[] {
  const modesMap: Record<string, GameMode> = {
    aram: {
      descriptionKey: 'createLobby.modeDescriptions.aram',
      iconUrl: `${CD_CDN}/aram/img/game-select-icon-default.png`,
      iconUrlActive: `${CD_CDN}/aram/img/game-select-icon-active.png`,
      id: 'aram',
      nameKey: 'createLobby.modes.aram',
      queues: [],
      videoUrlActive: `${CD_CDN}/aram/video/game-select-icon-active.webm`,
      videoUrlIntro: `${CD_CDN}/aram/video/game-select-icon-intro.webm`,
    },
    arena: {
      descriptionKey: 'createLobby.modeDescriptions.arena',
      iconUrl: `${CD_CDN}/strawberry/img/icon-empty.png`,
      iconUrlActive: `${CD_CDN}/strawberry/img/game-select-icon-active.png`,
      id: 'arena',
      nameKey: 'createLobby.modes.arena',
      queues: [],
    },
    clash: {
      descriptionKey: 'createLobby.modeDescriptions.clash',
      iconUrl: `${CD_CDN}/classic_sru/img/game-select-icon-default.png`,
      iconUrlActive: `${CD_CDN}/classic_sru/img/game-select-icon-active.png`,
      id: 'clash',
      nameKey: 'createLobby.modes.clash',
      queues: [],
      videoUrlActive: `${CD_CDN}/classic_sru/video/game-select-icon-active.webm`,
      videoUrlIntro: `${CD_CDN}/classic_sru/video/game-select-icon-intro.webm`,
    },
    classic: {
      descriptionKey: 'createLobby.modeDescriptions.classic',
      iconUrl: `${CD_CDN}/jade/img/game-select-mode-icon-default.png`,
      iconUrlActive: `${CD_CDN}/jade/img/game-select-mode-icon-selected.png`,
      id: 'classic',
      nameKey: 'createLobby.modes.classic',
      queues: [],
      videoUrlActive: `${CD_CDN}/jade/game-select-icon-active.webm`,
    },
    coop: {
      descriptionKey: 'createLobby.modeDescriptions.coopVsAi',
      iconUrl: `${CD_CDN}/classic_sru/img/game-select-icon-default.png`,
      iconUrlActive: `${CD_CDN}/classic_sru/img/game-select-icon-active.png`,
      id: 'coop',
      nameKey: 'createLobby.modes.coopVsAi',
      queues: [],
      videoUrlActive: `${CD_CDN}/classic_sru/video/game-select-icon-active.webm`,
      videoUrlIntro: `${CD_CDN}/classic_sru/video/game-select-icon-intro.webm`,
    },
    rgm: {
      descriptionKey: 'createLobby.modeDescriptions.rgm',
      iconUrl: `${CD_CDN}/shared/img/icon-rgm-empty.png`,
      iconUrlActive: `${CD_CDN}/shared/img/icon-rgm-active.png`,
      id: 'rgm',
      nameKey: 'createLobby.modes.rgm',
      queues: [],
      videoUrlActive: `${CD_CDN}/shared/video/game-select-icon-rgm-active.webm`,
      videoUrlIntro: `${CD_CDN}/shared/video/game-select-icon-rgm-intro.webm`,
    },
    sr: {
      descriptionKey: 'createLobby.modeDescriptions.sr',
      iconUrl: `${CD_CDN}/classic_sru/img/game-select-icon-default.png`,
      iconUrlActive: `${CD_CDN}/classic_sru/img/game-select-icon-active.png`,
      id: 'sr',
      nameKey: 'createLobby.modes.sr',
      queues: [],
      videoUrlActive: `${CD_CDN}/classic_sru/video/game-select-icon-active.webm`,
      videoUrlIntro: `${CD_CDN}/classic_sru/video/game-select-icon-intro.webm`,
    },
    tft: {
      descriptionKey: 'createLobby.modeDescriptions.tft',
      iconUrl: `${CD_CDN}/tft/img/game-select-icon-default.png`,
      iconUrlActive: `${CD_CDN}/tft/img/game-select-icon-active.png`,
      id: 'tft',
      nameKey: 'createLobby.modes.tft',
      queues: [],
    },
    training: {
      descriptionKey: 'createLobby.modeDescriptions.training',
      iconUrl: `${CD_CDN}/classic_sru/img/game-select-icon-default.png`,
      iconUrlActive: `${CD_CDN}/classic_sru/img/game-select-icon-active.png`,
      id: 'training',
      nameKey: 'createLobby.modes.training',
      queues: [],
      videoUrlActive: `${CD_CDN}/classic_sru/video/game-select-icon-active.webm`,
      videoUrlIntro: `${CD_CDN}/classic_sru/video/game-select-icon-intro.webm`,
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
      } else if (queue.mapId === 22 && queue.gameMode === 'TFT') {
        modesMap.tft.queues.push(queue)
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
    modesMap.arena.descriptionKey = 'createLobby.modeDescriptions.arenaRgm'
  }

  const modes = [
    modesMap.sr,
    modesMap.classic,
    modesMap.aram,
    modesMap.arena,
    modesMap.tft,
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
