import { afterEach, beforeEach, describe, expect, it } from 'bun:test'
import { Effect } from 'effect'
import jwt from 'jsonwebtoken'

import { app, initializeApp } from '../../src/index'
import { getJwtSecret, readCodeFromToken, readTokenFromRegisterBody } from '../helpers/auth-test-helpers'
import { cleanupDbFiles, createTempDbPath } from '../helpers/db-test-helpers'

const dbFiles: string[] = []

  beforeEach(async () => {
    Bun.env.LEYLINE_JWT_SECRET = 'test-secret'
    const path = createTempDbPath('tmp')
    dbFiles.push(path)
    await Effect.runPromise(initializeApp(path))
  })

afterEach(() => {
  cleanupDbFiles(dbFiles)
})

describe('relay /register', () => {
  it('returns 400 when pubkey is missing', async () => {
    const response = await app.handle(
      new Request('http://localhost/register', {
        body: JSON.stringify({}),
        headers: { 'content-type': 'application/json' },
        method: 'POST',
      }),
    )

    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({ error: 'Missing public key.', ok: false })
  })

  it('returns signed token with code for valid pubkey', async () => {
    const response = await app.handle(
      new Request('http://localhost/register', {
        body: JSON.stringify({ pubkey: 'pubkey-1' }),
        headers: { 'content-type': 'application/json' },
        method: 'POST',
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

  it('returns the same code when registering the same pubkey twice', async () => {
    const firstResponse = await app.handle(
      new Request('http://localhost/register', {
        body: JSON.stringify({ pubkey: 'pubkey-repeat' }),
        headers: { 'content-type': 'application/json' },
        method: 'POST',
      }),
    )

    const secondResponse = await app.handle(
      new Request('http://localhost/register', {
        body: JSON.stringify({ pubkey: 'pubkey-repeat' }),
        headers: { 'content-type': 'application/json' },
        method: 'POST',
      }),
    )

    const firstBody: unknown = await firstResponse.json()
    const secondBody: unknown = await secondResponse.json()
    const firstCode = readCodeFromToken(readTokenFromRegisterBody(firstBody))
    const secondCode = readCodeFromToken(readTokenFromRegisterBody(secondBody))

    expect(firstCode).toBe(secondCode)
  })

  it('returns 500 when JWT secret is missing', async () => {
    const originalSecret = Bun.env.LEYLINE_JWT_SECRET
    Bun.env.LEYLINE_JWT_SECRET = undefined

    try {
      const response = await app.handle(
        new Request('http://localhost/register', {
          body: JSON.stringify({ pubkey: 'pubkey-no-secret' }),
          headers: { 'content-type': 'application/json' },
          method: 'POST',
        }),
      )

      expect(response.status).toBe(500)
      expect(await response.json()).toEqual({ error: 'Missing LEYLINE_JWT_SECRET.', ok: false })
    } finally {
      Bun.env.LEYLINE_JWT_SECRET = originalSecret
    }
  })
})

describe('relay /check', () => {
  it('returns 400 when token query is missing', async () => {
    const response = await app.handle(new Request('http://localhost/check'))

    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({ error: 'Missing a token to check.', ok: false })
  })

  it('returns true when token is valid and code exists', async () => {
    const registerResponse = await app.handle(
      new Request('http://localhost/register', {
        body: JSON.stringify({ pubkey: 'pubkey-2' }),
        headers: { 'content-type': 'application/json' },
        method: 'POST',
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

  it('returns false when token is malformed', async () => {
    const response = await app.handle(new Request('http://localhost/check?token=not-a-jwt'))

    expect(response.status).toBe(200)
    expect(await response.json()).toBe(false)
  })

  it('returns 500 and false body when JWT secret is missing', async () => {
    const registerResponse = await app.handle(
      new Request('http://localhost/register', {
        body: JSON.stringify({ pubkey: 'pubkey-secret-check' }),
        headers: { 'content-type': 'application/json' },
        method: 'POST',
      }),
    )

    const registerBody: unknown = await registerResponse.json()
    const token = readTokenFromRegisterBody(registerBody)

    const originalSecret = Bun.env.LEYLINE_JWT_SECRET
    Bun.env.LEYLINE_JWT_SECRET = undefined

    try {
      const response = await app.handle(new Request(`http://localhost/check?token=${encodeURIComponent(token)}`))

      expect(response.status).toBe(500)
      expect(await response.json()).toBe(false)
    } finally {
      Bun.env.LEYLINE_JWT_SECRET = originalSecret
    }
  })
})
