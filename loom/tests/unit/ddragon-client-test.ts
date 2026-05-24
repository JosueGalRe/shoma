import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

type DdragonModule = {
  getChampion: (version: string, championId: number, language?: 'en' | 'es') => Promise<unknown>
  getChampionDetail: (version: string, championKey: string, language?: 'en' | 'es') => Promise<unknown>
  getChampions: (version: string, language?: 'en' | 'es') => Promise<Array<{ id: number; key: string; name: string }>>
  getLatestDdragonVersion: () => Promise<string>
  getProfileIconUrl: (version: string, iconId: number) => Promise<string | null>
}

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

const championImage = { full: 'Aatrox.png', sprite: 'champion0.png', group: 'champion', x: 0, y: 0, w: 48, h: 48 }
const spellImage = { full: 'AatroxQ.png', sprite: 'spell0.png', group: 'spell', x: 0, y: 0, w: 48, h: 48 }

function jsonResponse(body: unknown, init?: ResponseInit): Response {
  return new Response(JSON.stringify(body), {
    headers: { 'content-type': 'application/json' },
    ...init,
  })
}

function championPayload() {
  return {
    data: {
      Aatrox: {
        id: 'Aatrox',
        key: '266',
        name: 'Aatrox',
        title: 'the Darkin Blade',
        tags: ['Fighter'],
        partype: 'Blood Well',
        image: championImage,
        stats: { hp: 650 },
      },
    },
  }
}

function championDetailsPayload() {
  return {
    data: {
      Aatrox: {
        ...championPayload().data.Aatrox,
        lore: 'Once honored defenders.',
        blurb: 'Aatrox blurb.',
        passive: { name: 'Deathbringer Stance', description: 'Passive text.', image: spellImage },
        spells: [{ id: 'AatroxQ', name: 'The Darkin Blade', description: 'Q text.', tooltip: 'Q tooltip.', image: spellImage }],
        skins: [{ id: '266000', num: 0, name: 'default', chromas: false }],
      },
    },
  }
}

async function loadDdragonModule(): Promise<DdragonModule> {
  await vi.resetModules()
  return import('../../src/core/http/ddragon-client')
}

beforeEach(() => {
  requestedUrls.length = 0
  const localStorage = new StorageMock()
  const mockFetch: typeof fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
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

    if (url.endsWith('/cdn/14.10.1/img/profileicon/9999.png')) {
      return Promise.resolve(new Response(null, { status: 404 }))
    }

    return Promise.resolve(jsonResponse({ error: 'unexpected url' }, { status: 500 }))
  }

  Object.defineProperty(globalThis, 'window', { value: { localStorage }, configurable: true })
  Object.defineProperty(globalThis, 'localStorage', { value: localStorage, configurable: true })
  Object.defineProperty(globalThis, 'fetch', {
    value: mockFetch,
    configurable: true,
  })
})

afterEach(() => {
  Object.defineProperty(globalThis, 'fetch', { value: originalFetch, configurable: true })
  Object.defineProperty(globalThis, 'window', { value: originalWindow, configurable: true })
  Object.defineProperty(globalThis, 'localStorage', { value: originalLocalStorage, configurable: true })
})

describe('ddragon-client', () => {
  test('loads and localStorage-caches the latest version', async () => {
    const ddragon = await loadDdragonModule()

    expect(await ddragon.getLatestDdragonVersion()).toBe('14.10.1')
    expect(await ddragon.getLatestDdragonVersion()).toBe('14.10.1')

    expect(localStorage.getItem('shoma:ddragon:latest-version')).toBe('14.10.1')
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

    expect(await ddragon.getChampion('14.10.1', 266, 'en')).toEqual(
      expect.objectContaining({
        id: 266,
        key: 'Aatrox',
        lore: 'Once honored defenders.',
        spells: [expect.objectContaining({ id: 'AatroxQ' })],
        skins: [expect.objectContaining({ id: '266000' })],
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
    expect(await ddragon.getProfileIconUrl('14.10.1', 9999)).toBeNull()
    expect(await ddragon.getProfileIconUrl('14.10.1', 9999)).toBeNull()

    expect(requestedUrls.filter((url) => {return url.endsWith('/cdn/14.10.1/img/profileicon/1234.png')})).toHaveLength(1)
    expect(requestedUrls.filter((url) => {return url.endsWith('/cdn/14.10.1/img/profileicon/9999.png')})).toHaveLength(1)
  })
})
