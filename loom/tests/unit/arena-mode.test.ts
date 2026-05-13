import { describe, expect, mock, test } from 'bun:test'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React, { type ComponentType } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { I18nextProvider } from 'react-i18next'

import { getModeRules } from '../../src/features/modes/mode-engine'
import { i18n } from '../../src/i18n'
import { Route as ArenaRoute } from '../../src/routes/connected/arena/route'

// Stub Link for server rendering tests (avoids RouterProvider requirement)
mock.module('@tanstack/react-router', () => ({
  Link: ({ to, children, ...props }: { to: string; children: React.ReactNode }) =>
    React.createElement('a', { href: to, ...props }, children),
  createFileRoute: () => (config: Record<string, unknown>) => ({ options: config }),
}))

mock.module('@/core/relay/relay-client-provider', () => ({
  RelayClientProvider: ({ children }: { children: React.ReactNode }) => children,
  useSharedLCUTransport: () => null,
  useSharedRelayClient: () => ({ state: 'CONNECTED' }),
}))

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

  test('arena route renders mode information', () => {
    const queryClient = new QueryClient()
    const ArenaComponent = ArenaRoute.options.component as ComponentType
    const markup = renderToStaticMarkup(
      React.createElement(
        QueryClientProvider,
        { client: queryClient },
        React.createElement(I18nextProvider, { i18n }, React.createElement(ArenaComponent)),
      ),
    )

    expect(markup).toContain('Arena')
    expect(markup).toContain('Party size')
    expect(markup).toContain('/connected/champ-select')
  })
})
