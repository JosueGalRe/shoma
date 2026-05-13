import { afterEach, describe, expect, it } from 'bun:test'

import { RelayOpcode } from '@shoma/protocol-contract'

import { startRuntime } from '../../src/index'
import { readCodeFromToken, readTokenFromRegisterBody } from '../helpers/auth-test-helpers'
import { cleanupDbFiles, createTempDbPath } from '../helpers/db-test-helpers'
import { createFrameQueue, waitForClose, waitForOpen } from '../helpers/ws-test-helpers'

const dbFiles: string[] = []

afterEach(() => {
  cleanupDbFiles(dbFiles)
})

describe('runtime lifecycle', () => {
  it('starts and stops runtime safely', async () => {
    const dbPath = createTempDbPath('runtime')
    dbFiles.push(dbPath)

    const runtime = await startRuntime({
      port: 53050 + Math.floor(Math.random() * 1000),
      databasePath: dbPath,
      keepAliveIntervalMs: 5,
    })

    const response = await fetch(`http://127.0.0.1:${runtime.port}/`)
    expect(response.status).toBe(200)
    expect(await response.text()).toBe('Hai, relayo desu.')

    await runtime.stop()
    await runtime.stop()
  })

  it('runtime stop closes active websocket clients', async () => {
    Bun.env.LEYLINE_JWT_SECRET = 'test-secret'

    const dbPath = createTempDbPath('runtime-ws')
    dbFiles.push(dbPath)

    const runtime = await startRuntime({
      port: 54000 + Math.floor(Math.random() * 500),
      databasePath: dbPath,
      keepAliveIntervalMs: 5,
    })

    try {
      const registerResponse = await fetch(`http://127.0.0.1:${runtime.port}/register`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ pubkey: 'runtime-pubkey' }),
      })

      const registerBody: unknown = await registerResponse.json()
      const token = readTokenFromRegisterBody(registerBody)
      const code = readCodeFromToken(token)

      const conduit = new WebSocket(
        `ws://127.0.0.1:${runtime.port}/conduit?token=${encodeURIComponent(token)}&publicKey=${encodeURIComponent('runtime-pubkey')}`,
      )
      await waitForOpen(conduit)
      const conduitFrames = createFrameQueue(conduit)

      const mobile = new WebSocket(`ws://127.0.0.1:${runtime.port}/mobile`)
      await waitForOpen(mobile)
      const mobileFrames = createFrameQueue(mobile)

      mobile.send(JSON.stringify([RelayOpcode.CONNECT, code]))
      const openFrame = await conduitFrames.nextFrame()
      expect(openFrame[0]).toBe(RelayOpcode.OPEN)

      const pubkeyFrame = await mobileFrames.nextFrame()
      expect(pubkeyFrame).toEqual([RelayOpcode.CONNECT_PUBKEY, 'runtime-pubkey'])

      const conduitClosed = waitForClose(conduit)
      const mobileClosed = waitForClose(mobile)

      await runtime.stop()

      const [conduitCode, mobileCode] = await Promise.all([conduitClosed, mobileClosed])
      expect(conduitCode).toBe(1000)
      expect(mobileCode).toBe(1000)
    } finally {
      await runtime.stop()
    }
  })
})
