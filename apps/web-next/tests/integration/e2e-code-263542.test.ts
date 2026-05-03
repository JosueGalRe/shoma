import { afterAll, beforeAll, describe, expect, it } from 'bun:test'
import { unlinkSync } from 'node:fs'
import jwt from 'jsonwebtoken'

import { startRuntime } from '../../../rift-next/src/index'
import type { checkToken } from '../../src/core/http/rift-api'

type RuntimeHandle = ReturnType<typeof startRuntime>
type RiftApiModule = {
  checkToken: typeof checkToken
}

let runtime: RuntimeHandle | null = null
let dbPath = ''
let riftApi: RiftApiModule | null = null

// Code under test - provided by user
const TEST_CODE = '263542'

beforeAll(async () => {
  // Use the same secret as the live server for consistent testing
  Bun.env.RIFT_JWT_SECRET = 'h+GLdPKRjT3gaOe991VYHn2DMqT6Q7kXqVnJMYjl2Zc='

  const randomPort = 57500 + Math.floor(Math.random() * 300)
  dbPath = new URL(`./.e2e-test-${Date.now()}-${Math.random()}.db`, import.meta.url).pathname

  runtime = startRuntime({
    port: randomPort,
    databasePath: dbPath,
    keepAliveIntervalMs: 50,
  })

  Bun.env.VITE_RIFT_HTTP_BASE_URL = `http://127.0.0.1:${runtime.port}`
  riftApi = await import('../../src/core/http/rift-api')

  // Seed the database with the test code to simulate a registered conduit
  const { initializeDatabase, generateCode } = await import('../../../rift-next/src/core/database/database')
  initializeDatabase(dbPath)

  // Register the test code with a public key
  const testPubkey = 'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAzaiReBMwIa6C3Mte6Dl9RVmXuGK1G9FfOGTvXsbJ+WoqWyjXGyrdHrfj48ZHuTolIH+2g00U5l5k2ZRDBIM1xwB8UKakxVkW35PUbLjo7KpTwE+fERv7IYxJeLhg9Ypu5Gmq666mCtH5A9b8bzqldvT5Bp1iWB0jVrObwXALWC4TD8iYSSRM6iv4Rj/2IncNKRMc/GNNkGLPjPhHo3uUWx0LkQ5/Pt8iR35IuadQF5ASsVq0mbRCfpK2s7ucxdyRzprDGKOlSrcbBFlKTrgRq5kN32sfvRyvRMiHMSmf48XVa2jUqjN6bxrHGQkehSZ8pIILNeWHyZG/9sunWqaxdQIDAQAB'

  // Insert directly into database
  const { Database } = await import('bun:sqlite')
  const db = new Database(dbPath)
  db.run("INSERT OR REPLACE INTO conduit_instances (code, public_key) VALUES (?, ?)", [TEST_CODE, testPubkey])
  db.close()
})

afterAll(() => {
  runtime?.stop()
  Bun.env.VITE_RIFT_HTTP_BASE_URL = undefined

  try {
    unlinkSync(dbPath)
  } catch {
    // ignore test file cleanup issues
  }
})

describe('E2E: Code 263542 connection flow', () => {
  it('has code 263542 seeded in the test database', () => {
    const { Database } = require('bun:sqlite')
    const db = new Database(dbPath)
    const result = db.query("SELECT code FROM conduit_instances WHERE code = ?").get(TEST_CODE)
    db.close()

    expect(result).toBeDefined()
    expect(result.code).toBe(TEST_CODE)
  })

  it('generates a valid JWT token for code 263542', () => {
    const token = jwt.sign({ code: TEST_CODE }, Bun.env.RIFT_JWT_SECRET!)
    expect(typeof token).toBe('string')
    expect(token.split('.')).toHaveLength(3)

    // Verify we can decode it back
    const decoded = jwt.verify(token, Bun.env.RIFT_JWT_SECRET!)
    expect(decoded).toHaveProperty('code', TEST_CODE)
  })

  it('validates the token through the API check endpoint', async () => {
    if (!riftApi) {
      throw new Error('riftApi not initialized')
    }

    const token = jwt.sign({ code: TEST_CODE }, Bun.env.RIFT_JWT_SECRET!)
    const isValid = await riftApi.checkToken(token)
    expect(isValid).toBe(true)
  })

  it('returns false for an invalid token', async () => {
    if (!riftApi) {
      throw new Error('riftApi not initialized')
    }

    const isValid = await riftApi.checkToken('invalid-token')
    expect(isValid).toBe(false)
  })
})

describe('E2E: Lobby profile data flow', () => {
  it('lcu transport is created only once (useRef pattern)', () => {
    // Verify the fix is in place by checking the source code
    const fs = require('node:fs')
    const sourcePath = new URL('../../src/features/connect/hooks/use-rift-lcu-runtime.ts', import.meta.url).pathname
    const source = fs.readFileSync(sourcePath, 'utf8')

    // Should use useRef for mutable values
    expect(source).toInclude('const lcuTransportRef = useRef')
    expect(source).toInclude('useEffect(() => {')
    expect(source).toInclude('appendLogRef.current = appendLog')
    expect(source).toInclude('setPeerRef.current = setPeer')

    // Should NOT recreate transport on every render
    expect(source).toInclude('if (!lcuTransportRef.current)')
  })

  it('readSummonerData handles all LCU response formats', () => {
    const { readSummonerData } = require('../../src/routes/connected/lobby/-lobby-utils')

    // Format 1: displayName + tagLine
    const format1 = readSummonerData({ displayName: 'JosueGalRe', tagLine: '0001', profileIconId: 123 })
    expect(format1.displayName).toBe('JosueGalRe#0001')
    expect(format1.profileIconId).toBe(123)

    // Format 2: gameName + tagLine
    const format2 = readSummonerData({ gameName: 'JosueGalRe', tagLine: '0001', profileIconId: 456 })
    expect(format2.displayName).toBe('JosueGalRe#0001')
    expect(format2.profileIconId).toBe(456)

    // Format 3: name only (legacy)
    const format3 = readSummonerData({ name: 'JosueGalRe', profileIconId: 789 })
    expect(format3.displayName).toBe('JosueGalRe')
    expect(format3.profileIconId).toBe(789)

    // Format 4: summonerName only
    const format4 = readSummonerData({ summonerName: 'JosueGalRe', profileIconId: 999 })
    expect(format4.displayName).toBe('JosueGalRe')
    expect(format4.profileIconId).toBe(999)

    // Format 5: no tagLine
    const format5 = readSummonerData({ displayName: 'JosueGalRe', profileIconId: 111 })
    expect(format5.displayName).toBe('JosueGalRe')

    // Format 6: null/invalid
    const format6 = readSummonerData(null)
    expect(format6.displayName).toBeNull()
    expect(format6.profileIconId).toBeNull()
  })

  it('profile icon URL builder works with ddragon version', () => {
    const { buildSummonerIconUrl } = require('../../src/routes/connected/lobby/-lobby-utils')

    const url = buildSummonerIconUrl('14.10.1', 1234)
    expect(url).toBe('https://ddragon.leagueoflegends.com/cdn/14.10.1/img/profileicon/1234.png')

    const nullUrl = buildSummonerIconUrl(null, 1234)
    expect(nullUrl).toBeNull()
  })
})
