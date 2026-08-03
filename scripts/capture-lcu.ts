/**
 * capture-lcu.ts — Interactive LCU response capturer for champ-select fixtures.
 *
 * Reads the League client lockfile (port + password rotate every client restart),
 * offers a menu of champ-select endpoints, and saves raw JSON responses to
 * loom/tests/fixtures/champ-select/ with a timestamp + your label.
 *
 * Usage: pnpm run capture:lcu
 */
import { appendFileSync, existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const FIXTURES_DIR = join(import.meta.dir, '..', 'loom', 'tests', 'fixtures', 'champ-select')

const LOCKFILE_ENV = process.env.LCU_LOCKFILE

// Convert a Windows path (D:\Games\League of Legends) to its WSL mount (/mnt/d/Games/League of Legends)
function toWslPath(winPath: string): string {
  const match = /^([A-Za-z]):[\\/](.*)$/.exec(winPath.trim())

  if (!match) {
    return winPath
  }

  return `/mnt/${match[1].toLowerCase()}/${match[2].replaceAll('\\', '/')}`
}

// Riot Client records every install (including custom drives/paths) in RiotClientInstalls.json
function lockfilesFromRiotClientInstalls(): string[] {
  const mounts = existsSync('/mnt') ? readdirSync('/mnt') : []

  return mounts.flatMap((mount) => {
    const installsPath = join('/mnt', mount, 'ProgramData/Riot Games/RiotClientInstalls.json')

    if (!existsSync(installsPath)) {
      return []
    }

    try {
      const json: unknown = JSON.parse(readFileSync(installsPath, 'utf8'))
      const associated =
        typeof json === 'object' && json !== null
          ? (json as { associated_client?: Record<string, unknown> }).associated_client
          : undefined

      return Object.entries(associated ?? {}).flatMap(([installRoot, product]) => {
        return typeof product === 'string' && product.includes('LeagueClient')
          ? [join(toWslPath(installRoot), 'lockfile')]
          : []
      })
    } catch {
      return []
    }
  })
}

// Ask Windows for the running client path via WSL interop
function lockfileFromProcess(): string[] {
  for (const name of ['LeagueClientUx', 'LeagueClient']) {
    const proc = Bun.spawnSync({
      cmd: [
        'powershell.exe',
        '-NoProfile',
        '-Command',
        `Get-Process ${name} -ErrorAction SilentlyContinue | Select-Object -First 1 | ForEach-Object { Split-Path $_.Path -Parent }`,
      ],
      stderr: 'ignore',
      stdout: 'pipe',
    })
    const winPath = new TextDecoder().decode(proc.stdout).trim()

    if (proc.exitCode === 0 && /^[A-Za-z]:/.test(winPath)) {
      return [join(toWslPath(winPath), 'lockfile')]
    }
  }

  return []
}

function lockfileCandidates(): string[] {
  const drives = 'cdefghijklmnopqrstuvwz'.split('')
  const staticPaths = drives.flatMap((drive) => {
    return [
      `/mnt/${drive}/Riot Games/League of Legends/lockfile`,
      `/mnt/${drive}/Program Files/Riot Games/League of Legends/lockfile`,
      `/mnt/${drive}/Program Files (x86)/Riot Games/League of Legends/lockfile`,
    ]
  })

  return [LOCKFILE_ENV, ...lockfilesFromRiotClientInstalls(), ...lockfileFromProcess(), ...staticPaths].filter(
    (path): path is string => Boolean(path),
  )
}

const ENDPOINTS: { group: string; hint: string; label: string; path: string }[] = [
  {
    group: 'Auto',
    hint: 'captura todo automáticamente al detectar champ select (Ctrl+C para salir)',
    label: 'auto-watch (gameflow)',
    path: '',
  },
  {
    group: 'Auto',
    hint: 'dumpea eventos LCU (champ-select/gameflow) a JSONL — para rastrear Champion Cards',
    label: 'ws-watch (events)',
    path: '',
  },
  {
    group: 'Core',
    hint: 'una vez por fase: planning / bans / picks / finalization',
    label: 'session',
    path: '/lol-champ-select/v1/session',
  },
  {
    group: 'Core',
    hint: 'una vez por draft (lee los cellIds de la session)',
    label: 'summoners (auto from session)',
    path: '',
  },
  {
    group: 'Core',
    hint: 'con un champ hovereado o lockeado',
    label: 'current-champion',
    path: '/lol-champ-select/v1/current-champion',
  },
  {
    group: 'Listas',
    hint: 'durante la fase de picks',
    label: 'pickable-champion-ids',
    path: '/lol-champ-select/v1/pickable-champion-ids',
  },
  {
    group: 'Listas',
    hint: 'durante la fase de bans (en PLANNING devuelve [-1])',
    label: 'bannable-champion-ids',
    path: '/lol-champ-select/v1/bannable-champion-ids',
  },
  {
    group: 'Listas',
    hint: 'cualquier momento (suele ser [])',
    label: 'disabled-champion-ids',
    path: '/lol-champ-select/v1/disabled-champion-ids',
  },
  {
    group: 'Listas',
    hint: 'una sola vez, cualquier momento',
    label: 'all-grid-champions',
    path: '/lol-champ-select/v1/all-grid-champions',
  },
  {
    group: 'Post-pick',
    hint: 'después de pickear/lockear tu champ',
    label: 'pickable-skin-ids',
    path: '/lol-champ-select/v1/pickable-skin-ids',
  },
  {
    group: 'Swaps (solo con una activa)',
    hint: 'alguien pidió trade de champ',
    label: 'champion-swaps',
    path: '/lol-champ-select/v1/session/champion-swaps',
  },
  {
    group: 'Swaps (solo con una activa)',
    hint: 'alguien pidió swappear orden de pick',
    label: 'pick-order-swaps',
    path: '/lol-champ-select/v1/session/pick-order-swaps',
  },
  {
    group: 'Swaps (solo con una activa)',
    hint: 'alguien pidió swappear posición',
    label: 'position-swaps',
    path: '/lol-champ-select/v1/session/position-swaps',
  },
  {
    group: 'Swaps (solo con una activa)',
    hint: 'mientras la trade sigue en curso',
    label: 'ongoing-champion-swap',
    path: '/lol-champ-select/v1/ongoing-champion-swap',
  },
  {
    group: 'Por verificar',
    hint: 'candidato a Champion Cards — capturar en los primeros 15s de una ARAM',
    label: 'aw-set',
    path: '/lol-champ-select/v1/aw-set',
  },
  {
    group: 'Por verificar',
    hint: 'namespace team-builder (moderno) — aw-set durante ARAM',
    label: 'tb aw-set',
    path: '/lol-lobby-team-builder/champ-select/v1/aw-set',
  },
  {
    group: 'Por verificar',
    hint: 'namespace team-builder (moderno) — session durante cualquier draft',
    label: 'tb session',
    path: '/lol-lobby-team-builder/champ-select/v1/session',
  },
  { group: 'Otros', hint: 'cualquier path LCU', label: 'custom path', path: '' },
]

function readCredentials(): { password: string; port: string } {
  const lockfile = lockfileCandidates().find((path) => {
    return existsSync(path)
  })

  if (lockfile) {
    const content = readFileSync(lockfile, 'utf8').trim()
    const [, , port, password] = content.split(':')

    if (port && password) {
      console.log(`Lockfile: ${lockfile} (port ${port})`)
      return { password, port }
    }
  }

  console.log('No lockfile found. Enter credentials manually (from lockfile: name:pid:port:password:protocol).')
  const port = prompt('Port:')?.trim() ?? ''
  const password = prompt('Password:')?.trim() ?? ''

  if (!port || !password) {
    console.error('Port and password are required.')
    process.exit(1)
  }

  return { password, port }
}

function timestamp(): string {
  const now = new Date()
  const pad = (value: number) => {
    return String(value).padStart(2, '0')
  }

  return `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`
}

async function fetchLcu(baseUrl: string, password: string, path: string): Promise<unknown | null> {
  const proc = Bun.spawn(['curl', '-sk', '--http1.1', '-u', `riot:${password}`, `${baseUrl}${path}`], {
    stderr: 'ignore',
    stdout: 'pipe',
  })
  const body = await new Response(proc.stdout).text()
  const exitCode = await proc.exited

  if (exitCode !== 0 || body.trim().length === 0) {
    console.log('Request failed (client unreachable?).')
    return null
  }

  const parsed: unknown = JSON.parse(body)

  if (typeof parsed === 'object' && parsed !== null && 'errorCode' in parsed) {
    const { httpStatus, message } = parsed as { httpStatus?: number; message?: string }
    console.log(`LCU error ${httpStatus ?? '?'}: ${message ?? 'unknown'}`)
    return null
  }

  return parsed
}

function saveFixture(data: unknown, label: string): void {
  const slug = label.toLowerCase().replaceAll(/[^a-z0-9]+/g, '-').replaceAll(/(^-|-$)/g, '')
  const file = join(FIXTURES_DIR, `${timestamp()}-${slug}.json`)

  mkdirSync(FIXTURES_DIR, { recursive: true })
  writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`)
  console.log(`Saved: ${file}`)
}

async function capture(baseUrl: string, password: string, path: string): Promise<void> {
  const data = await fetchLcu(baseUrl, password, path)

  if (data === null) {
    console.log('Not saved.')
    return
  }

  const defaultLabel = path.split('/').filter(Boolean).pop() ?? 'capture'
  const label = prompt(`Label [${defaultLabel}]:`)?.trim() || defaultLabel
  saveFixture(data, label)
}

function extractCellIds(session: unknown): number[] {
  if (typeof session !== 'object' || session === null) {
    return []
  }

  const { localPlayerCellId, myTeam, theirTeam } = session as {
    localPlayerCellId?: unknown
    myTeam?: unknown
    theirTeam?: unknown
  }
  const ids: number[] = []
  const push = (value: unknown) => {
    if (typeof value === 'number' && !ids.includes(value)) {
      ids.push(value)
    }
  }

  push(localPlayerCellId)

  for (const team of [myTeam, theirTeam]) {
    if (!Array.isArray(team)) {
      continue
    }

    for (const member of team) {
      if (typeof member === 'object' && member !== null) {
        push((member as { cellId?: unknown }).cellId)
      }
    }
  }

  return ids
}

async function watchGameflow(baseUrl: string, password: string): Promise<void> {
  const seen = new Map<string, string>()
  let draftId: number | null = null
  let sessionSeq = 0

  const captureIfChanged = async (key: string, path: string, label: string) => {
    const data = await fetchLcu(baseUrl, password, path)

    if (data === null) {
      return
    }

    const serialized = JSON.stringify(data)

    if (seen.get(key) === serialized) {
      return
    }

    seen.set(key, serialized)
    saveFixture(data, label)
  }

  console.log('Watching gameflow phase… Ctrl+C to stop.')

  for (;;) {
    const phase = await fetchLcu(baseUrl, password, '/lol-gameflow/v1/gameflow-phase')

    if (phase !== 'ChampSelect') {
      if (draftId !== null) {
        console.log('Draft ended, back to watching.')
      }

      draftId = null
      seen.clear()
      sessionSeq = 0
      await Bun.sleep(2000)
      continue
    }

    const session = await fetchLcu(baseUrl, password, '/lol-champ-select/v1/session')

    if (session === null || typeof session !== 'object') {
      await Bun.sleep(1500)
      continue
    }

    const { gameId, localPlayerCellId, myTeam, timer } = session as {
      gameId?: unknown
      localPlayerCellId?: unknown
      myTeam?: unknown
      timer?: { phase?: unknown }
    }

    if (typeof gameId === 'number' && gameId !== draftId) {
      draftId = gameId
      seen.clear()
      sessionSeq = 0
      console.log(`Champ select detected (gameId ${gameId}).`)
    }

    const serialized = JSON.stringify(session)

    if (seen.get('session') === serialized) {
      await Bun.sleep(1500)
      continue
    }

    seen.set('session', serialized)
    sessionSeq += 1

    const phaseSlug = String(timer?.phase ?? 'unknown').toLowerCase()
    saveFixture(session, `session-${phaseSlug}-${String(sessionSeq).padStart(2, '0')}`)

    for (const cellId of extractCellIds(session)) {
      await captureIfChanged(`summoner-${cellId}`, `/lol-champ-select/v1/summoners/${cellId}`, `summoner-cell${cellId}-${phaseSlug}`)
    }

    await captureIfChanged('bannable', '/lol-champ-select/v1/bannable-champion-ids', `bannable-champion-ids-${phaseSlug}`)
    await captureIfChanged('pickable', '/lol-champ-select/v1/pickable-champion-ids', `pickable-champion-ids-${phaseSlug}`)
    await captureIfChanged('disabled', '/lol-champ-select/v1/disabled-champion-ids', 'disabled-champion-ids')
    await captureIfChanged('tb-aw-set', '/lol-lobby-team-builder/champ-select/v1/aw-set', 'tb-aw-set')
    await captureIfChanged('tb-session', '/lol-lobby-team-builder/champ-select/v1/session', 'tb-session')
    await captureIfChanged('grid', '/lol-champ-select/v1/all-grid-champions', 'all-grid-champions')

    const localMember = Array.isArray(myTeam)
      ? myTeam.find((member) => {
          return (
            typeof member === 'object' &&
            member !== null &&
            (member as { cellId?: unknown }).cellId === localPlayerCellId
          )
        })
      : undefined
    const localChampionId =
      typeof localMember === 'object' && localMember !== null ? (localMember as { championId?: unknown }).championId : 0

    if (typeof localChampionId === 'number' && localChampionId > 0) {
      await captureIfChanged('skins', '/lol-champ-select/v1/pickable-skin-ids', 'pickable-skin-ids')
      await captureIfChanged('current', '/lol-champ-select/v1/current-champion', 'current-champion')
    }

    await Bun.sleep(1500)
  }
}

// Dump LCU websocket events (champ-select / team-builder / gameflow) to a JSONL file.
// LCU speaks WAMP: [5, topic] subscribes, events arrive as [8, topic, {data, eventType, uri}].
function wsWatch(password: string, port: string): void {
  const file = join(FIXTURES_DIR, `${timestamp()}-ws-events.jsonl`)
  const auth = Buffer.from(`riot:${password}`).toString('base64')
  const interesting = /champ-select|team-builder|gameflow/

  mkdirSync(FIXTURES_DIR, { recursive: true })
  console.log(`Connecting to wss://127.0.0.1:${port}…`)

  const ws = new WebSocket(`wss://127.0.0.1:${port}`, {
    headers: { Authorization: `Basic ${auth}` },
    // Bun-specific option for the LCU self-signed cert
    tls: { rejectUnauthorized: false },
  })

  ws.addEventListener('open', () => {
    ws.send(JSON.stringify([5, 'OnJsonApiEvent']))
    console.log(`Subscribed. Dumping events to: ${file}`)
    console.log('Watching… Ctrl+C to stop.')
  })

  ws.addEventListener('message', (event) => {
    if (typeof event.data !== 'string') {
      return
    }

    let msg: unknown

    try {
      msg = JSON.parse(event.data)
    } catch {
      return
    }

    if (!Array.isArray(msg) || msg[0] !== 8) {
      return
    }

    const [, topic, payload] = msg as [unknown, string, { data?: unknown; eventType?: string; uri?: string }]
    const uri = payload?.uri ?? ''

    if (!interesting.test(topic) && !interesting.test(uri)) {
      return
    }

    const line = JSON.stringify({
      data: payload?.data,
      eventType: payload?.eventType,
      receivedAt: Date.now(),
      topic,
      uri,
    })

    appendFileSync(file, `${line}\n`)
    console.log(`${payload?.eventType ?? '?'} ${uri || topic}`)
  })

  ws.addEventListener('error', () => {
    console.log('WebSocket error (client reachable?).')
  })

  ws.addEventListener('close', (event) => {
    console.log(`WebSocket closed (code ${event.code}).`)
  })
}

async function captureSummoners(baseUrl: string, password: string): Promise<void> {
  const session = await fetchLcu(baseUrl, password, '/lol-champ-select/v1/session')

  if (session === null) {
    return
  }

  const cellIds = extractCellIds(session)

  if (cellIds.length === 0) {
    console.log('No cellIds found in the session payload.')
    return
  }

  const label = prompt('Label [summoner]:')?.trim() || 'summoner'

  for (const cellId of cellIds) {
    const data = await fetchLcu(baseUrl, password, `/lol-champ-select/v1/summoners/${cellId}`)

    if (data !== null) {
      saveFixture(data, `${label}-cell${cellId}`)
    }
  }
}

const { password, port } = readCredentials()
const baseUrl = `https://127.0.0.1:${port}`

console.log(`\nSaving fixtures to: ${FIXTURES_DIR}\n`)

async function runMenu(): Promise<void> {
  for (;;) {
    let lastGroup = ''
    ENDPOINTS.forEach((endpoint, index) => {
      if (endpoint.group !== lastGroup) {
        console.log(` ${endpoint.group}:`)
        lastGroup = endpoint.group
      }

      console.log(`  ${index + 1}. ${endpoint.label} — ${endpoint.hint}`)
    })
    console.log('  q. quit')

    const choice = prompt('\nEndpoint:')?.trim().toLowerCase() ?? ''

    if (choice === 'q' || choice === '') {
      break
    }

    const index = Number(choice) - 1
    const endpoint = ENDPOINTS[index]

    if (!endpoint) {
      console.log('Invalid choice.')
      continue
    }

    let path = endpoint.path

    if (endpoint.label.startsWith('auto-watch')) {
      await watchGameflow(baseUrl, password)
      console.log('')
      continue
    }

    if (endpoint.label.startsWith('ws-watch')) {
      wsWatch(password, port)
      // Park forever WITHOUT prompt(): a sync prompt would block the event loop and
      // starve the websocket callbacks. Ctrl+C to exit.
      await new Promise(() => {})
    }

    if (endpoint.label.startsWith('summoners')) {
      await captureSummoners(baseUrl, password)
      console.log('')
      continue
    }

    if (endpoint.label === 'custom path') {
      path = prompt('Path (e.g. /lol-champ-select/v1/session):')?.trim() ?? ''

      if (!path.startsWith('/')) {
        console.log('Path must start with /.')
        continue
      }
    }

    await capture(baseUrl, password, path)
    console.log('')
  }
}

if (process.argv[2] === 'menu') {
  await runMenu()
} else {
  // Default: fully automatic — websocket event dump + HTTP watcher, no interaction.
  console.log('Auto mode: ws-watch + auto-watch running (Ctrl+C to stop). `pnpm capture:lcu menu` for manual captures.\n')
  wsWatch(password, port)
  await watchGameflow(baseUrl, password)
}
