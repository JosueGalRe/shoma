import { useState } from 'react'

import { Button } from '@shoma/ui/button'
import { Chip } from '@shoma/ui/chip'
import { ScreenBackground } from '@shoma/ui/screen-background'
import { text } from '@shoma/ui/text'
import { color } from '@shoma/ui/tokens/color.stylex'
import { create, props } from '@stylexjs/stylex'
import { useNavigate } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'

import { TopBar } from '@/components/layout/top-bar'
import { relayStoreSelectors, useRelayStore } from '@/core/state/relay-store'

import { SettingsSheet } from './settings-sheet'

// Figma "Dashboard": connected with no lobby yet, the way into the create-lobby steps. DISCONNECTED (Figma Errors)
// While the relay is away, until the session comes back by itself
export function DashboardScreen() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const isLost = useRelayStore(relayStoreSelectors.status) === 'lost'

  return (
    <div {...props(styles.screen)}>
      <ScreenBackground image="/backgrounds/dashboard.webp" />

      <TopBar
        onOpenSettings={() => {
          setIsSettingsOpen(true)
        }}
      />

      <main {...props(styles.content)}>
        <Chip style={isLost ? styles.lostChip : undefined}>
          {t(isLost ? 'connection.status.disconnected' : 'connection.status.connected')}
        </Chip>

        <hr {...props(styles.divider)} />

        <div>
          <h1 {...props(text.heading2, styles.welcome)}>{t('dashboard.welcome')}</h1>

          <p {...props(text.heading2, styles.welcome)}>{t('dashboard.ready')}</p>
        </div>

        <Button
          disabled={isLost}
          onClick={() => {
            void navigate({ to: '/connected/create-lobby' })
          }}
        >
          {t('dashboard.createLobby')}
        </Button>
      </main>

      <SettingsSheet open={isSettingsOpen} onOpenChange={setIsSettingsOpen} />
    </div>
  )
}

const styles = create({
  content: {
    alignItems: 'center',
    display: 'flex',
    flexDirection: 'column',
    flexGrow: 1,
    gap: 30,
    justifyContent: 'center',
    // The Figma sits the block about 30px above the screen's center
    paddingBlockEnd: 128,
    paddingInline: 16,
  },
  divider: {
    backgroundColor: color.text,
    borderWidth: 0,
    height: 1,
    margin: 0,
    width: 227,
  },
  lostChip: {
    backgroundColor: color.chipLost,
    color: color.text,
  },
  screen: {
    display: 'flex',
    flexDirection: 'column',
    flexGrow: 1,
    minHeight: 0,
  },
  welcome: {
    color: color.text,
    margin: 0,
    textAlign: 'center',
  },
})
