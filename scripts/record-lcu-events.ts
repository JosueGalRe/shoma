/**
 * Records the League client's lobby, queue, ready-check, champ-select and gameflow events as JSONL, for loom's
 * simulator to replay. Runs with bun on the Windows PC that has the client, and only listens and GETs.
 *
 * Writes %USERPROFILE%\shoma-recordings\<start>.jsonl, one `{ t, eventType, uri, data }` per line, starting each
 * client connection with a `Snapshot` of the current state. Waits for the client and follows its restarts; Ctrl+C
 * stops it. The file has player names: it stays out of the repo.
 *
 * Usage (on the PC): bun record-lcu-events.ts
 */
import { appendFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'

const RECORDED = /^\/(?:lol-champ-select|lol-lobby-team-builder|lol-gameflow|lol-lobby|lol-matchmaking)\//
const SNAPSHOT_PATHS = [
  '/lol-gameflow/v1/session',
  '/lol-lobby/v2/lobby',
  '/lol-matchmaking/v1/search',
  '/lol-matchmaking/v1/ready-check',
  '/lol-champ-select/v1/session',
]
const RETRY_MS = 5000
const OUT_DIR = join(homedir(), 'shoma-recordings')
const FILE = join(OUT_DIR, `${new Date().toISOString().replaceAll(':', '-')}.jsonl`)

interface Credentials {
  auth: string
  port: string
}

function readCredentials(): Credentials | null {
  const installsPath = join(process.env.ProgramData ?? String.raw`C:\ProgramData`, 'Riot Games', 'RiotClientInstalls.json')
  const installs: unknown = existsSync(installsPath) ? JSON.parse(readFileSync(installsPath, 'utf8')) : null
  const clients =
    typeof installs === 'object' && installs !== null && 'associated_client' in installs ? installs.associated_client : null
  const league = Object.keys(typeof clients === 'object' && clients !== null ? clients : {}).find((path) => {
    return path.includes('League of Legends')
  })
  const lockfile = league ? join(league, 'lockfile') : null

  if (!lockfile || !existsSync(lockfile)) {
    return null
  }

  // Name:pid:port:password:protocol
  const [port, password] = readFileSync(lockfile, 'utf8').split(':').slice(2)

  return port && password ? { auth: `Basic ${Buffer.from(`riot:${password}`).toString('base64')}`, port } : null
}

function record(entry: { data: unknown; eventType: string; status?: number; uri: string }): void {
  appendFileSync(FILE, `${JSON.stringify({ t: Date.now(), ...entry })}\n`)
}

async function snapshot({ auth, port }: Credentials): Promise<void> {
  for (const uri of SNAPSHOT_PATHS) {
    const response = await fetch(`https://127.0.0.1:${port}${uri}`, {
      headers: { Authorization: auth },
      tls: { rejectUnauthorized: false },
    }).catch(() => {
      return null
    })

    if (response) {
      record({ data: response.ok ? await response.json() : null, eventType: 'Snapshot', status: response.status, uri })
    }
  }
}

function parseMessage(data: unknown): unknown {
  try {
    return typeof data === 'string' ? JSON.parse(data) : null
  } catch {
    // The subscription's acknowledgement is an empty frame
    return null
  }
}

function readEvent(data: unknown): { data: unknown; eventType: string; uri: string } | null {
  const message = parseMessage(data)

  if (!Array.isArray(message) || message[0] !== 8) {
    return null
  }

  const payload: unknown = message[2]

  if (typeof payload !== 'object' || payload === null || !('uri' in payload) || typeof payload.uri !== 'string') {
    return null
  }

  return {
    data: 'data' in payload ? payload.data : null,
    eventType: 'eventType' in payload ? String(payload.eventType) : '',
    uri: payload.uri,
  }
}

async function connect(): Promise<void> {
  const credentials = readCredentials()

  if (!credentials) {
    setTimeout(connect, RETRY_MS)

    return
  }

  await snapshot(credentials)

  const socket = new WebSocket(`wss://127.0.0.1:${credentials.port}`, {
    headers: { Authorization: credentials.auth },
    tls: { rejectUnauthorized: false },
  })

  socket.addEventListener('open', () => {
    socket.send(JSON.stringify([5, 'OnJsonApiEvent']))
    console.log(`Recording to ${FILE}`)
  })

  socket.addEventListener('message', (message) => {
    const event = readEvent(message.data)

    if (event && RECORDED.test(event.uri)) {
      record(event)
      console.log(`${new Date().toLocaleTimeString()} ${event.eventType} ${event.uri}`)
    }
  })

  socket.addEventListener('close', () => {
    console.log('The client went away; waiting for it.')
    setTimeout(connect, RETRY_MS)
  })
}

mkdirSync(OUT_DIR, { recursive: true })
console.log('Waiting for the League client…')
await connect()
