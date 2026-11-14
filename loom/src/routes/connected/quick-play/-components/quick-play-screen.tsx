import { Button } from '@shoma/ui/button'
import { ScreenBackground } from '@shoma/ui/screen-background'
import { text } from '@shoma/ui/text'
import { color } from '@shoma/ui/tokens/color.stylex'
import { create, props } from '@stylexjs/stylex'
import { useNavigate } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'

import { TopBar } from '@/components/layout/top-bar'

import type { QuickPlayScreenProps } from './quick-play-screen-types'

// The pickers' frame, as Figma draws them: title, the picker, and CONFIRM in the "Bottom Action"
export function QuickPlayScreen({ children, confirmDisabled, hasError, onConfirm, title }: QuickPlayScreenProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()

  return (
    <div {...props(styles.screen)}>
      <ScreenBackground />

      <TopBar
        onBack={() => {
          void navigate({ to: '/connected/lobby' })
        }}
      />

      <main {...props(styles.content)}>
        <h1 {...props(text.heading2, styles.title)}>{title}</h1>

        {children}
      </main>

      <footer {...props(styles.footer)}>
        {hasError ? (
          <p role="alert" {...props(text.body4, styles.error)}>
            {t('lobby.quickPlay.saveFailed')}
          </p>
        ) : null}

        <Button disabled={confirmDisabled} onClick={onConfirm}>
          {t('createLobby.confirm')}
        </Button>
      </footer>
    </div>
  )
}

const styles = create({
  // Figma "Body": 16 above and below, 24 at the sides, 32 between its parts
  content: {
    display: 'flex',
    flexDirection: 'column',
    flexGrow: 1,
    gap: 32,
    minHeight: 0,
    paddingBlock: 16,
    paddingInline: 24,
  },
  error: {
    color: color.danger,
    margin: 0,
    textAlign: 'center',
  },
  footer: {
    backgroundColor: color.background,
    display: 'flex',
    flexDirection: 'column',
    flexShrink: 0,
    gap: 10,
    paddingBlock: 16,
    paddingInline: 24,
  },
  screen: {
    display: 'flex',
    flexDirection: 'column',
    flexGrow: 1,
    minHeight: 0,
  },
  title: {
    color: color.text,
    flexShrink: 0,
    margin: 0,
  },
})
