import { afterEach, beforeEach, describe, expect, it } from 'bun:test'

import jwt from 'jsonwebtoken'

import { app, initializeApp } from '../../src/index'
import { getJwtSecret, readCodeFromToken, readTokenFromRegisterBody } from '../helpers/auth-test-helpers'
import { cleanupDbFiles, createTempDbPath } from '../helpers/db-test-helpers'

const dbFiles: string[] = []

beforeEach(() => {
  Bun.env.RIFT_JWT_SECRET = 'test-secret'
  const path = createTempDbPath('tmp')
  dbFiles.push(path)
  initializeApp(path)
})

afterEach(() => {
  cleanupDbFiles(dbFiles)
})

describe('rift-next /register', () => {
  it('returns 400 when pubkey is missing', async () => {
    const response = await app.handle(
      new Request('http://localhost/register', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({}),
      }),
    )

    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({ ok: false, error: 'Missing public key.' })
  })

  it('returns signed token with code for valid pubkey', async () => {
    const response = await app.handle(
      new Request('http://localhost/register', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ pubkey: 'pubkey-1' }),
      }),
    )

    expect(response.status).toBe(200)
    const body: unknown = await response.json()
    if (typeof body !== 'object' || body === null || !('ok' in body)) {
      throw new Error('Expected register response body.')
    }

    expect(body.ok).toBe(true)

    const token = readTokenFromRegisterBody(body)
    const code = readCodeFromToken(token)
    expect(code).toHaveLength(6)
  })
})

describe('rift-next /check', () => {
  it('returns 400 when token query is missing', async () => {
    const response = await app.handle(new Request('http://localhost/check'))

    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({ ok: false, error: 'Missing a token to check.' })
  })

  it('returns true when token is valid and code exists', async () => {
    const registerResponse = await app.handle(
      new Request('http://localhost/register', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ pubkey: 'pubkey-2' }),
      }),
    )

    const registerBody: unknown = await registerResponse.json()
    const token = readTokenFromRegisterBody(registerBody)
    const checkResponse = await app.handle(new Request(`http://localhost/check?token=${encodeURIComponent(token)}`))
    expect(await checkResponse.json()).toBe(true)
  })

  it('returns false when token is valid but code does not exist', async () => {
    const token = jwt.sign({ code: '999999' }, getJwtSecret())
    const response = await app.handle(new Request(`http://localhost/check?token=${encodeURIComponent(token)}`))

    expect(await response.json()).toBe(false)
  })
})
