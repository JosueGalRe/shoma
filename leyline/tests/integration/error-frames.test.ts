import { afterAll, beforeAll, describe, expect, it } from 'bun:test'

import { Effect } from 'effect'

import { RelayErrorCode, RelayOpcode } from '@shoma/protocol-contract'

import { app, initializeApp } from '../../src/index'
import { readTokenFromRegisterBody } from '../helpers/auth-test-helpers'
import { cleanupDbFiles, createTempDbPath } from '../helpers/db-test-helpers'
import { createFrameQueue, waitForClose, waitForOpen } from '../helpers/ws-test-helpers'

const port = 53000 + Math.floor(Math.random() * 1000)
const baseUrl = `http://127.0.0.1:${port}`
const dbFiles: string[] = []
const dbPath = createTempDbPath('error-frames')
dbFiles.push(dbPath)

let server: { stop: () => void } | null = null

function collectFrames(ws: WebSocket) {
  const frames: unknown[][] = []

  ws.addEventListener('message', (event) => {
    const parsed: unknown = JSON.parse(String(event.data))
    if (Array.isArray(parsed)) {
      frames.push(parsed)
    }
  })

  return frames
}

async function register(pubkey: string) {
  const registerResponse = await fetch(`${baseUrl}/register`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ pubkey }),
  })

  const registerBody: unknown = await registerResponse.json()
  return readTokenFromRegisterBody(registerBody)
}

beforeAll(async () => {
  Bun.env.LEYLINE_JWT_SECRET = 'test-secret'
  await Effect.runPromise(initializeApp(dbPath))
  const startedServer = app.listen(port)
  server = { stop: () => startedServer.stop() }
})

afterAll(() => {
  server?.stop()
  cleanupDbFiles(dbFiles)
})

describe('websocket error frames', () => {
  it('sends invalid_code before closing mobile socket', async () => {
    const mobile = new WebSocket(`ws://127.0.0.1:${port}/mobile`)
    const mobileFrames = createFrameQueue(mobile)
    await waitForOpen(mobile)

    mobile.send(JSON.stringify([RelayOpcode.CONNECT, '999999']))

    const errorFrame = await mobileFrames.nextFrame()
    expect(errorFrame).toEqual([RelayOpcode.ERROR, { code: RelayErrorCode.INVALID_CODE }])

    const closeCode = await waitForClose(mobile)
    expect(closeCode).toBe(1000)
  })

  it('sends invalid_token before closing conduit socket', async () => {
    const conduit = new WebSocket(
      `ws://127.0.0.1:${port}/conduit?token=${encodeURIComponent('not-a-valid-token')}&publicKey=${encodeURIComponent('pubkey')}`,
    )
    const conduitFrames = createFrameQueue(conduit)
    await waitForOpen(conduit)

    const errorFrame = await conduitFrames.nextFrame()
    expect(errorFrame).toEqual([RelayOpcode.ERROR, { code: RelayErrorCode.INVALID_TOKEN }])

    const closeCode = await waitForClose(conduit)
    expect(closeCode).toBe(1000)
  })

  it('does not send an error frame on valid conduit open', async () => {
    const token = await register('valid-open-pubkey')
    const conduit = new WebSocket(
      `ws://127.0.0.1:${port}/conduit?token=${encodeURIComponent(token)}&publicKey=${encodeURIComponent('valid-open-pubkey')}`,
    )
    const frames = collectFrames(conduit)

    await waitForOpen(conduit)
    await Bun.sleep(50)

    expect(frames.some((frame) => frame[0] === RelayOpcode.ERROR)).toBe(false)

    conduit.close()
  })
})
