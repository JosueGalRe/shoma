import { useId, useState } from 'react'

import { Button } from '@shoma/ui/button'
import { Loader } from '@shoma/ui/loader'
import { OtpField } from '@shoma/ui/otp-field'
import { ScreenBackground } from '@shoma/ui/screen-background'
import { text } from '@shoma/ui/text'
import { color } from '@shoma/ui/tokens/color.stylex'
import { create, keyframes, props } from '@stylexjs/stylex'
import { useTranslation } from 'react-i18next'

import { Logo } from '@/components/logo'
import { RelayClientState } from '@/core/relay/relay-client'

import { CONNECT_CODE_LENGTH, getConnectionStatusMessage } from '../connect-utils'
import { useConnectionFlow } from '../hooks/use-connection-flow'

import { RecentSessionsList } from './recent-sessions-list'

import type { ConnectScreenProps } from '../connect-types'

// Figma "Pairing Screen" (Inicio): logo, instructions and code, centered.
// A complete code connects right away, and the loader holds the screen until the relay answers.
export function ConnectScreen({ installButtonLabel, onInstallClick }: ConnectScreenProps) {
  const { t } = useTranslation()
  const instructionsId = useId()
  const [formatError, setFormatError] = useState(false)
  const {
    clientState,
    code,
    error,
    handleCancel,
    handleConnect,
    onReconnectRecent,
    onRemoveRecent,
    recentSessions,
    setCode,
    status,
  } = useConnectionFlow()

  const isConnecting =
    status === 'connecting' || clientState === RelayClientState.CONNECTING || clientState === RelayClientState.HANDSHAKING

  const handleCodeChange = (value: string) => {
    setFormatError(false)
    setCode(value)
  }

  const handleCodeInvalid = () => {
    setFormatError(true)
  }

  const errorMessage = formatError ? t('connection.errors.invalidFormat') : error && t(error)

  return (
    <div {...props(styles.screen)}>
      <ScreenBackground />

      <main key={isConnecting ? 'connecting' : 'pairing'} {...props(styles.content)}>
        {isConnecting ? (
          <>
            <Loader aria-label={getConnectionStatusMessage({ clientState, error, status }, t)} style={styles.loader} />

            <Button size="medium" variant="tertiary" onClick={handleCancel}>
              {t('common.cancel')}
            </Button>
          </>
        ) : (
          <>
            <div {...props(styles.pairing)}>
              <h1 {...props(styles.logo)}>
                <Logo />
              </h1>

              <p id={instructionsId} {...props(text.heading3, styles.instructions)}>
                {t('connection.instructions')}
              </p>

              <OtpField
                aria-labelledby={instructionsId}
                error={errorMessage || undefined}
                length={CONNECT_CODE_LENGTH}
                style={styles.code}
                value={code}
                onValueChange={handleCodeChange}
                onValueComplete={handleConnect}
                onValueInvalid={handleCodeInvalid}
              />
            </div>

            <RecentSessionsList onReconnect={onReconnectRecent} onRemove={onRemoveRecent} sessions={recentSessions} />
          </>
        )}
      </main>

      <footer {...props(styles.footer)}>
        {installButtonLabel && onInstallClick ? (
          <Button size="medium" variant="tertiary" onClick={onInstallClick}>
            {installButtonLabel}
          </Button>
        ) : null}

        <a href={__GIT_COMMIT_URL__} rel="noopener noreferrer" target="_blank" {...props(text.body4, styles.build)}>
          Build {__GIT_COMMIT_SHORT__}
        </a>
      </footer>
    </div>
  )
}

const fadeIn = keyframes({
  from: { opacity: 0 },
  to: { opacity: 1 },
})

const styles = create({
  build: {
    color: color.textMuted,
    textDecoration: 'none',
  },
  // Slots, gap and two lines of error, so the centered block doesn't jump when an error shows up
  code: {
    minHeight: 110,
  },
  // Remounts when the loader and the form swap, so each fades in instead of cutting
  content: {
    alignItems: 'center',
    animationDuration: '200ms',
    animationName: fadeIn,
    animationTimingFunction: 'ease-out',
    display: 'flex',
    flexDirection: 'column',
    flexGrow: 1,
    gap: 40,
    justifyContent: 'center',
  },
  footer: {
    alignItems: 'center',
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  instructions: {
    color: color.text,
    margin: 0,
    textAlign: 'center',
  },
  loader: {
    height: 113,
    width: 113,
  },
  logo: {
    margin: 0,
  },
  pairing: {
    alignItems: 'center',
    display: 'flex',
    flexDirection: 'column',
    gap: 30,
    maxWidth: 328,
  },
  // 16px sides so the 328px code still fits a 375px phone
  // Native scroll, not ScrollArea: Radix's display:table viewport breaks the flexGrow centering
  screen: {
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    flexGrow: 1,
    gap: 24,
    minHeight: 0,
    overflowY: 'auto',
    paddingBlock: 24,
    paddingInline: 16,
  },
})
