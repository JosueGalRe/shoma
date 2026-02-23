import { afterAll, beforeAll, describe, expect, it } from 'bun:test'

import jwt from 'jsonwebtoken'

import { RiftOpcode } from '@mimic/protocol-contract'

import { app, initializeApp } from '../../src/index'
import { getJwtSecret, readCodeFromToken, readTokenFromRegisterBody } from '../helpers/auth-test-helpers'
import { cleanupDbFiles, createTempDbPath } from '../helpers/db-test-helpers'
import { createFrameQueue, waitForClose, waitForOpen } from '../helpers/ws-test-helpers'

const port = 52000 + Math.floor(Math.random() * 1000)
const baseUrl = `http://127.0.0.1:${port}`
const dbFiles: string[] = []
const dbPath = createTempDbPath('ws')
dbFiles.push(dbPath)

let server: { stop: () => void } | null = null

function readPeerId(frame: unknown[]): string {
  const peerId = frame[1]
  if (typeof peerId !== 'string') {
    throw new Error('Expected peer id string.')
  }

  return peerId
}

beforeAll(() => {
  Bun.env.RIFT_JWT_SECRET = 'test-secret'
  initializeApp(dbPath)
  const startedServer = app.listen(port)
  server = { stop: () => startedServer.stop() }
})

afterAll(() => {
  server?.stop()
  cleanupDbFiles(dbFiles)
})

describe('websocket integration', () => {
  it('relays mobile/conduit frames with legacy opcode behavior', async () => {
    const registerResponse = await fetch(`${baseUrl}/register`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ pubkey: 'initial-pubkey' }),
    })

    const registerBody: unknown = await registerResponse.json()
    const token = readTokenFromRegisterBody(registerBody)
    const code = readCodeFromToken(token)

    const conduit = new WebSocket(
      `ws://127.0.0.1:${port}/conduit?token=${encodeURIComponent(token)}&publicKey=${encodeURIComponent('updated-pubkey')}`,
    )
    await waitForOpen(conduit)
    const conduitFrames = createFrameQueue(conduit)

    const mobile = new WebSocket(`ws://127.0.0.1:${port}/mobile`)
    await waitForOpen(mobile)
    const mobileFrames = createFrameQueue(mobile)

    mobile.send(JSON.stringify([RiftOpcode.CONNECT, code]))

    const conduitOpenFrame = await conduitFrames.nextFrame()
    expect(conduitOpenFrame[0]).toBe(RiftOpcode.OPEN)
    const peerId = readPeerId(conduitOpenFrame)
    expect(typeof peerId).toBe('string')

    const mobilePubkeyFrame = await mobileFrames.nextFrame()
    expect(mobilePubkeyFrame).toEqual([RiftOpcode.CONNECT_PUBKEY, 'updated-pubkey'])

    mobile.send(JSON.stringify([RiftOpcode.SEND, 'hello-from-mobile']))
    const conduitMessageFrame = await conduitFrames.nextFrame()
    expect(conduitMessageFrame).toEqual([RiftOpcode.MSG, peerId, 'hello-from-mobile'])

    conduit.send(JSON.stringify([RiftOpcode.REPLY, peerId, 'hello-from-conduit']))
    const mobileMessageFrame = await mobileFrames.nextFrame()
    expect(mobileMessageFrame).toEqual([RiftOpcode.RECEIVE, 'hello-from-conduit'])

    mobile.close()
    const conduitCloseFrame = await conduitFrames.nextFrame()
    expect(conduitCloseFrame).toEqual([RiftOpcode.CLOSE, peerId])

    conduit.close()
  })

  it('closes conduit socket when publicKey is missing', async () => {
    const registerResponse = await fetch(`${baseUrl}/register`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ pubkey: 'auth-pubkey' }),
    })

    const registerBody: unknown = await registerResponse.json()
    const token = readTokenFromRegisterBody(registerBody)
    const conduit = new WebSocket(`ws://127.0.0.1:${port}/conduit?token=${encodeURIComponent(token)}`)
    await waitForOpen(conduit)

    const closeCode = await waitForClose(conduit)
    expect(closeCode).toBe(1000)
  })

  it('closes conduit socket when token is invalid', async () => {
    const conduit = new WebSocket(
      `ws://127.0.0.1:${port}/conduit?token=${encodeURIComponent('not-a-valid-token')}&publicKey=${encodeURIComponent('pubkey')}`,
    )
    await waitForOpen(conduit)

    const closeCode = await waitForClose(conduit)
    expect(closeCode).toBe(1000)
  })

  it('closes conduit socket when token code does not exist', async () => {
    const staleToken = jwt.sign({ code: '999999' }, getJwtSecret())
    const conduit = new WebSocket(
      `ws://127.0.0.1:${port}/conduit?token=${encodeURIComponent(staleToken)}&publicKey=${encodeURIComponent('pubkey')}`,
    )
    await waitForOpen(conduit)

    const closeCode = await waitForClose(conduit)
    expect(closeCode).toBe(1000)
  })

  it('evicts older conduit connection for the same code', async () => {
    const registerResponse = await fetch(`${baseUrl}/register`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ pubkey: 'first-pubkey' }),
    })

    const registerBody: unknown = await registerResponse.json()
    const token = readTokenFromRegisterBody(registerBody)
    const code = readCodeFromToken(token)

    const conduitOne = new WebSocket(
      `ws://127.0.0.1:${port}/conduit?token=${encodeURIComponent(token)}&publicKey=${encodeURIComponent('first-pubkey')}`,
    )
    await waitForOpen(conduitOne)

    const conduitTwo = new WebSocket(
      `ws://127.0.0.1:${port}/conduit?token=${encodeURIComponent(token)}&publicKey=${encodeURIComponent('second-pubkey')}`,
    )
    await waitForOpen(conduitTwo)

    const conduitOneCloseCode = await waitForClose(conduitOne)
    expect(conduitOneCloseCode).toBe(1000)

    const conduitTwoFrames = createFrameQueue(conduitTwo)
    const mobile = new WebSocket(`ws://127.0.0.1:${port}/mobile`)
    await waitForOpen(mobile)
    const mobileFrames = createFrameQueue(mobile)

    mobile.send(JSON.stringify([RiftOpcode.CONNECT, code]))

    const conduitOpenFrame = await conduitTwoFrames.nextFrame()
    expect(conduitOpenFrame[0]).toBe(RiftOpcode.OPEN)

    const mobilePubkeyFrame = await mobileFrames.nextFrame()
    expect(mobilePubkeyFrame).toEqual([RiftOpcode.CONNECT_PUBKEY, 'second-pubkey'])

    conduitTwo.close()
    mobile.close()
  })

  it('closes connected mobile peers when conduit disconnects', async () => {
    const registerResponse = await fetch(`${baseUrl}/register`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ pubkey: 'cleanup-pubkey' }),
    })

    const registerBody: unknown = await registerResponse.json()
    const token = readTokenFromRegisterBody(registerBody)
    const code = readCodeFromToken(token)

    const conduit = new WebSocket(
      `ws://127.0.0.1:${port}/conduit?token=${encodeURIComponent(token)}&publicKey=${encodeURIComponent('cleanup-pubkey')}`,
    )
    await waitForOpen(conduit)
    const conduitFrames = createFrameQueue(conduit)

    const mobile = new WebSocket(`ws://127.0.0.1:${port}/mobile`)
    await waitForOpen(mobile)
    const mobileFrames = createFrameQueue(mobile)

    mobile.send(JSON.stringify([RiftOpcode.CONNECT, code]))
    const openFrame = await conduitFrames.nextFrame()
    expect(openFrame[0]).toBe(RiftOpcode.OPEN)

    const pubkeyFrame = await mobileFrames.nextFrame()
    expect(pubkeyFrame).toEqual([RiftOpcode.CONNECT_PUBKEY, 'cleanup-pubkey'])

    conduit.close()
    const mobileCloseCode = await waitForClose(mobile)
    expect(mobileCloseCode).toBe(1000)
  })
})
