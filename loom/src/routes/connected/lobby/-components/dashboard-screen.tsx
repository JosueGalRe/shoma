import { Button } from '@shoma/ui/button'
import { Chip } from '@shoma/ui/chip'
import { ScreenBackground } from '@shoma/ui/screen-background'
import { text } from '@shoma/ui/text'
import { color } from '@shoma/ui/tokens/color.stylex'
import { create, props } from '@stylexjs/stylex'
import { useNavigate } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'

import { TopBar } from '@/components/layout/top-bar'

// Figma "Dashboard": connected with no lobby yet, the way into the create-lobby steps
export function DashboardScreen() {
  const { t } = useTranslation()
  const navigate = useNavigate()

  return (
    <div {...props(styles.screen)}>
      <ScreenBackground image="/backgrounds/dashboard.webp" />

      <TopBar />

      <main {...props(styles.content)}>
        <Chip>{t('connection.status.connected')}</Chip>

        <hr {...props(styles.divider)} />

        <div>
          <h1 {...props(text.heading2, styles.welcome)}>{t('dashboard.welcome')}</h1>

          <p {...props(text.heading2, styles.welcome)}>{t('dashboard.ready')}</p>
        </div>

        <Button
          onClick={() => {
            void navigate({ to: '/connected/create-lobby' })
          }}
        >
          {t('dashboard.createLobby')}
        </Button>
      </main>
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
