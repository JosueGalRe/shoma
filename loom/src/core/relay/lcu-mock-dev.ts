import type { QueryClient } from '@tanstack/react-query'

import {
  champSelectSessionDescriptor,
  gameflowPhaseDescriptor,
  queueSearchDescriptor,
  readyCheckDescriptor,
} from '@/core/lcu/lcu-queries'
import type { LcuQueryDescriptor } from '@/core/lcu/lcu-queries'

type LcuMockAlias = 'gameflowPhase' | 'readyCheck' | 'champSelectSession' | 'queueSearch'

type LcuMockDescriptor = LcuQueryDescriptor<unknown>

type LcuMockUpdateDetail = {
  alias: LcuMockAlias
  content: unknown
  path: string
  status: number
}

const mockDescriptors = {
  champSelectSession: champSelectSessionDescriptor,
  gameflowPhase: gameflowPhaseDescriptor,
  queueSearch: queueSearchDescriptor,
  readyCheck: readyCheckDescriptor,
} satisfies Record<LcuMockAlias, LcuMockDescriptor>

declare global {
  interface Window {
    __shomaMockLcu?: (alias: LcuMockAlias, data: unknown) => void
  }
}

function readDescriptor(alias: string): [LcuMockAlias, LcuMockDescriptor] | null {
  if (isLcuMockAlias(alias)) {
    return [alias, mockDescriptors[alias]]
  }

  return null
}

function isLcuMockAlias(alias: string): alias is LcuMockAlias {
  return alias in mockDescriptors
}

function parseMockValue(descriptor: LcuMockDescriptor, data: unknown): unknown {
  return descriptor.parse(data) ?? descriptor.notFoundValue ?? null
}

function emitMockUpdate(detail: LcuMockUpdateDetail): void {
  window.dispatchEvent(new CustomEvent('shoma:lcu-mock-update', { detail }))
}

export function mountLcuMockDev(queryClient: QueryClient): void {
  window.__shomaMockLcu = (alias, data) => {
    const descriptorEntry = readDescriptor(alias)

    if (!descriptorEntry) {
      throw new Error(`Unknown Sho'ma LCU mock alias: ${alias}`)
    }

    const [mockAlias, descriptor] = descriptorEntry
    const value = parseMockValue(descriptor, data)

    queryClient.setQueryData(descriptor.queryKey, value)
    emitMockUpdate({ alias: mockAlias, content: data, path: descriptor.path, status: 200 })
  }

  // DevTools usage:
  // window.__shomaMockLcu('gameflowPhase', 'ReadyCheck')
  // window.__shomaMockLcu('readyCheck', { state: 'InProgress', playerResponse: 'None' })
}
