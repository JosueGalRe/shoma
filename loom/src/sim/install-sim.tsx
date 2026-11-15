import { createRoot } from 'react-dom/client'

import { useRelayStore } from '@/core/state/relay-store'
import { isRecord } from '@/lib/type-guards'

import { SimPanel } from './sim-panel'
import { installSimRelay, SimRelay } from './sim-relay'
import { createInitialSimState, SimWorld } from './sim-world'

import type { SimCaptures, SimState } from './sim-types'

const ENABLED_KEY = 'shoma-sim'
const STATE_KEY = 'shoma-sim-state'
// Any six digits pair with the simulator
const SIM_CODE = '424242'

// Git-ignored: they carry the account's name, friends and chats. pnpm run sim:capture writes them
const captureFiles = import.meta.glob('../../.sim/captures.json', { import: 'default' })

declare global {
  // eslint-disable-next-line no-underscore-dangle -- Exposes the simulator to the dev console and agent-browser.
  var __shomaSim: SimRelay | undefined
}

async function loadFirst(files: Record<string, () => Promise<unknown>>): Promise<unknown> {
  const [load] = Object.values(files)

  return load ? load() : null
}

function parseCaptures(file: unknown): SimCaptures {
  const responses = isRecord(file) && isRecord(file.responses) ? file.responses : {}

  return Object.fromEntries(
    Object.entries(responses).flatMap(([path, response]) => {
      return isRecord(response) && typeof response.status === 'number'
        ? [[path, { content: response.content, status: response.status }]]
        : []
    }),
  )
}

function isSimState(value: unknown): value is SimState {
  return (
    isRecord(value) &&
    Object.keys(createInitialSimState()).every((key) => {
      return key in value
    })
  )
}

function readSavedState(): SimState | undefined {
  try {
    const saved: unknown = JSON.parse(sessionStorage.getItem(STATE_KEY) ?? 'null')

    return isSimState(saved) ? saved : undefined
  } catch {
    return undefined
  }
}

/**
 * Dev only. `?sim` turns the simulator on (it stays on across reloads) and pairs with it; `?sim=0` turns it off.
 * Runs before the app renders, so the relay client's first socket is already the simulated one.
 */
export async function installSim(): Promise<void> {
  const param = new URLSearchParams(globalThis.location.search).get('sim')

  if (param === '0') {
    localStorage.removeItem(ENABLED_KEY)
    sessionStorage.removeItem(STATE_KEY)

    return
  }

  if (param === null && localStorage.getItem(ENABLED_KEY) !== '1') {
    return
  }

  localStorage.setItem(ENABLED_KEY, '1')

  const captures = await loadFirst(captureFiles)

  if (Object.keys(captureFiles).length === 0) {
    console.warn('[sim] loom/.sim/captures.json is missing: run pnpm run sim:capture. Game data answers 404 until then')
  }

  const world = new SimWorld({ captures: parseCaptures(captures), state: readSavedState() })
  const relay = new SimRelay(world)

  world.onChange(() => {
    sessionStorage.setItem(STATE_KEY, JSON.stringify(world.state))
  })

  installSimRelay(relay)
  // eslint-disable-next-line no-underscore-dangle -- Exposes the simulator to the dev console and agent-browser.
  globalThis.__shomaSim = relay

  const root = document.createElement('div')

  document.body.append(root)
  createRoot(root).render(<SimPanel relay={relay} />)

  if (param !== null && useRelayStore.getState().code.length === 0) {
    useRelayStore.getState().connect(SIM_CODE)
  }
}
