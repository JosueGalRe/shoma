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

export function groupQueuesByMode(queues: GameQueue[], defaultGameQueues: number[]): GameMode[] {
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
      iconUrl: `${CD_CDN}/cherry/img/game-select-icon-default.png`,
      iconUrlActive: `${CD_CDN}/cherry/img/game-select-icon-active.png`,
      id: 'arena',
      nameKey: 'createLobby.modes.arena',
      queues: [],
      videoUrlActive: `${CD_CDN}/cherry/video/game-select-icon-active.webm`,
      videoUrlIntro: `${CD_CDN}/cherry/video/game-select-icon-intro.webm`,
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
  }

  for (const queue of queues) {
    if (queue.mapId === 11 && queue.gameMode === 'CLASSIC') {
      modesMap.sr.queues.push(queue)
    } else if (queue.mapId === 12 && queue.gameMode === 'ARAM') {
      modesMap.aram.queues.push(queue)
    } else if (queue.mapId === 22 && queue.gameMode === 'TFT') {
      modesMap.tft.queues.push(queue)
    } else if (queue.mapId === 30 && queue.gameMode === 'CHERRY') {
      modesMap.arena.queues.push(queue)
    } else {
      modesMap.rgm.queues.push(queue)
    }
  }

  const modes = [modesMap.sr, modesMap.aram, modesMap.tft, modesMap.arena, modesMap.rgm].filter((mode) => {
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

  return modes
}
