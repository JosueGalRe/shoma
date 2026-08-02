import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

import { ChampionId } from '../../src/core/types/branded'

class StorageMock implements Storage {
  readonly #values = new Map<string, string>()

  get length(): number {
    return this.#values.size
  }

  clear(): void {
    this.#values.clear()
  }

  getItem(key: string): string | null {
    return this.#values.get(key) ?? null
  }

  key(index: number): string | null {
    return [...this.#values.keys()][index] ?? null
  }

  removeItem(key: string): void {
    this.#values.delete(key)
  }

  setItem(key: string, value: string): void {
    this.#values.set(key, value)
  }
}

const originalFetch = globalThis.fetch
const originalWindow = globalThis.window
const originalLocalStorage = globalThis.localStorage
const requestedUrls: string[] = []

const championImage = { full: 'Aatrox.png', group: 'champion', h: 48, sprite: 'champion0.png', w: 48, x: 0, y: 0 }
const spellImage = { full: 'AatroxQ.png', group: 'spell', h: 48, sprite: 'spell0.png', w: 48, x: 0, y: 0 }

function jsonResponse(body: unknown, init?: ResponseInit): Response {
  return Response.json(body, init)
}

function championPayload() {
  return {
    data: {
      Aatrox: {
        id: 'Aatrox',
        image: championImage,
        key: '266',
        name: 'Aatrox',
        partype: 'Blood Well',
        stats: { hp: 650 },
        tags: ['Fighter'],
        title: 'the Darkin Blade',
      },
    },
  }
}

function championDetailsPayload() {
  return {
    data: {
      Aatrox: {
        ...championPayload().data.Aatrox,
        blurb: 'Aatrox blurb.',
        lore: 'Once honored defenders.',
        passive: { description: 'Passive text.', image: spellImage, name: 'Deathbringer Stance' },
        skins: [{ chromas: false, id: '266000', name: 'default', num: 0 }],
        spells: [{ description: 'Q text.', id: 'AatroxQ', image: spellImage, name: 'The Darkin Blade', tooltip: 'Q tooltip.' }],
      },
    },
  }
}

async function loadDdragonModule() {
  vi.resetModules()

  return import('../../src/core/http/ddragon')
}

beforeEach(() => {
  requestedUrls.length = 0

  const localStorage = new StorageMock()
  const mockFetch = Object.assign(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' || input instanceof URL ? String(input) : input.url

    requestedUrls.push(`${init?.method ?? 'GET'} ${url}`)

    if (url.endsWith('/api/versions.json')) {
      return Promise.resolve(jsonResponse(['14.10.1']))
    }

    if (url.endsWith('/cdn/14.10.1/data/en_US/champion.json')) {
      return Promise.resolve(jsonResponse(championPayload()))
    }

    if (url.endsWith('/cdn/14.10.1/data/es_MX/champion.json')) {
      return Promise.resolve(jsonResponse(championPayload()))
    }

    if (url.endsWith('/cdn/14.10.1/data/en_US/champion/Aatrox.json')) {
      return Promise.resolve(jsonResponse(championDetailsPayload()))
    }

    if (url.endsWith('/cdn/14.10.1/img/profileicon/1234.png')) {
      return Promise.resolve(new Response(null, { status: 200 }))
    }

    if (url.endsWith('/cdn/14.10.1/img/profileicon/8888.png')) {
      return Promise.resolve(new Response(null, { status: 403 }))
    }

    if (url.endsWith('/cdn/14.10.1/img/profileicon/9999.png')) {
      return Promise.resolve(new Response(null, { status: 404 }))
    }

    return Promise.resolve(jsonResponse({ error: 'unexpected url' }, { status: 500 }))
  }, {
    preconnect: () => {
      return undefined
    },
  })

  Object.defineProperty(globalThis, 'window', { configurable: true, value: { localStorage } })
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: localStorage })

  Object.defineProperty(globalThis, 'fetch', {
    configurable: true,
    value: mockFetch,
  })
})

afterEach(() => {
  Object.defineProperty(globalThis, 'fetch', { configurable: true, value: originalFetch })
  Object.defineProperty(globalThis, 'window', { configurable: true, value: originalWindow })
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: originalLocalStorage })
})

describe('ddragon-client', () => {
  test('loads and localStorage-caches the latest version', async () => {
    const ddragon = await loadDdragonModule()

    expect(await ddragon.getLatestDdragonVersion()).toBe('14.10.1')
    expect(await ddragon.getLatestDdragonVersion()).toBe('14.10.1')

    const cached = localStorage.getItem('shoma:ddragon:latest-version')
    expect(cached).not.toBeNull()
    expect(JSON.parse(cached ?? '')).toMatchObject({ version: '14.10.1' })
    expect(requestedUrls.filter((url) => {return url.endsWith('/api/versions.json')})).toHaveLength(1)
  })

  test('refetches the latest version when the cache holds a legacy plain-string pin', async () => {
    localStorage.setItem('shoma:ddragon:latest-version', '16.12.1')
    const ddragon = await loadDdragonModule()

    expect(await ddragon.getLatestDdragonVersion()).toBe('14.10.1')
    expect(requestedUrls.filter((url) => {return url.endsWith('/api/versions.json')})).toHaveLength(1)
  })

  test('refetches the latest version when the cache entry is stale', async () => {
    localStorage.setItem(
      'shoma:ddragon:latest-version',
      JSON.stringify({ cachedAt: Date.now() - 48 * 60 * 60 * 1000, version: '16.12.1' }),
    )
    const ddragon = await loadDdragonModule()

    expect(await ddragon.getLatestDdragonVersion()).toBe('14.10.1')
    expect(requestedUrls.filter((url) => {return url.endsWith('/api/versions.json')})).toHaveLength(1)
  })


  test('parses and memory-caches champion lists by version and language', async () => {
    const ddragon = await loadDdragonModule()

    expect(await ddragon.getChampions('14.10.1', 'en')).toEqual([
      expect.objectContaining({ id: 266, key: 'Aatrox', name: 'Aatrox' }),
    ])

    await ddragon.getChampions('14.10.1', 'en')

    expect(requestedUrls.filter((url) => {return url.endsWith('/cdn/14.10.1/data/en_US/champion.json')})).toHaveLength(1)
  })

  test('loads champion details using the numeric champion id', async () => {
    const ddragon = await loadDdragonModule()

    expect(await ddragon.getChampion('14.10.1', ChampionId(266), 'en')).toEqual(
      expect.objectContaining({
        id: ChampionId(266),
        key: 'Aatrox',
        lore: 'Once honored defenders.',
        skins: [expect.objectContaining({ id: '266000' })],
        spells: [expect.objectContaining({ id: 'AatroxQ' })],
      }),
    )
  })

  test('loads champion details using the champion key', async () => {
    const ddragon = await loadDdragonModule()

    expect(await ddragon.getChampionDetail('14.10.1', 'Aatrox', 'en')).toEqual(
      expect.objectContaining({
        key: 'Aatrox',
        passive: expect.objectContaining({ name: 'Deathbringer Stance' }),
        spells: [expect.objectContaining({ id: 'AatroxQ', name: 'The Darkin Blade' })],
      }),
    )
  })

  test('caches profile icon probes including missing assets', async () => {
    const ddragon = await loadDdragonModule()

    expect(await ddragon.getProfileIconUrl('14.10.1', 1234)).toBe(
      'https://ddragon.leagueoflegends.com/cdn/14.10.1/img/profileicon/1234.png',
    )

    expect(await ddragon.getProfileIconUrl('14.10.1', 1234)).toBe(
      'https://ddragon.leagueoflegends.com/cdn/14.10.1/img/profileicon/1234.png',
    )

    expect(await ddragon.getProfileIconUrl('14.10.1', 8888)).toBeNull()
    expect(await ddragon.getProfileIconUrl('14.10.1', 9999)).toBeNull()
    expect(await ddragon.getProfileIconUrl('14.10.1', 9999)).toBeNull()

    expect(requestedUrls.filter((url) => {return url.endsWith('/cdn/14.10.1/img/profileicon/1234.png')})).toHaveLength(1)
    expect(requestedUrls.filter((url) => {return url.endsWith('/cdn/14.10.1/img/profileicon/9999.png')})).toHaveLength(1)
  })
})
