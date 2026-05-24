import { describe, expect, vi, test } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import { getModeRules } from '../../src/features/modes/mode-engine'

vi.mock('react-i18next', () => {return {
  initReactI18next: { init: () => undefined, type: '3rdParty' },
  useTranslation: () => ({
    t: (key: string, variables?: Record<string, unknown>) => {
      if (key === 'arena.partySize' && variables) {
        return `Party size ${variables.current}/${variables.max}`
      }

      return key
    },
  }),
}})

// Stub Link for server rendering tests (avoids RouterProvider requirement)
vi.mock('@tanstack/react-router', () => {return {
  Link: () => null,
  createFileRoute: () => (config: Record<string, unknown>) => ({ options: config }),
  lazyRouteComponent: (component: unknown) => component,
}})

describe('arena mode', () => {
  test('uses simultaneous bans without standard runes or summoner spells', () => {
    expect(getModeRules('arena')).toMatchObject({
      hasBans: true,
      hasSimultaneousBans: true,
      maxPartySize: 2,
      usesRunes: false,
      usesSummonerSpells: false,
    })
  })

  test('arena route source contains mode information', () => {
    const source = readFileSync(join(process.cwd(), 'src/routes/connected/arena/route.tsx'), 'utf8')

    expect(source).toContain('Arena')
    expect(source).toContain('arena.partySize')
    expect(source).toContain('/connected/champ-select')
  })
})
