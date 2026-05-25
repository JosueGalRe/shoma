import { useState } from 'react'

import { useTranslation } from 'react-i18next'

import { Button, Card, CardContent } from '@/components/ui'
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp'
import { RelayClientState } from '@/core/relay/relay-client'

import { getConnectionStatusMessage, getConnectionTone, isCompleteConnectCode } from '../connect-utils'
import { useConnectionFlow } from '../hooks/use-connection-flow'

import { connectScreenStyles } from './connect-screen-styles'

import type { ConnectScreenProps } from '../connect-types'

export function ConnectScreen({ installButtonLabel, onInstallClick, title }: ConnectScreenProps) {
  const { t } = useTranslation()
  const [codeError, setCodeError] = useState<string | null>(null)
  const { code, setCode, status, clientState, error, handleConnect, handleCancel } = useConnectionFlow()

  const isConnecting =
    status === 'connecting' || clientState === RelayClientState.CONNECTING || clientState === RelayClientState.HANDSHAKING
  const tone = getConnectionTone({ clientState, error, status })
  const styles = connectScreenStyles({ tone })

  const handleCodeChange = (value: string) => {
    setCode(value)

    if (codeError && isCompleteConnectCode(value)) {
      setCodeError(null)
    }
  }

  const handleConnectSubmit = () => {
    if (!isCompleteConnectCode(code)) {
      setCodeError(t('connection.errors.invalidCode'))

      return
    }

    setCodeError(null)
    handleConnect(code)
  }

  return (
    <div className={styles.root()}>
      <Card className={styles.card()}>
        <CardContent className={styles.content()}>
          <div className={styles.titleWrap()}>
            <h1 className={styles.title()}>{title}</h1>
          </div>

          <div className={styles.statusRow()}>
            <div className={styles.statusDotWrap()}>
              <span className={styles.statusPing()} />

              <span className={styles.statusDot()} />
            </div>

            <span className={styles.statusText()}>{getConnectionStatusMessage({ clientState, error, status }, t)}</span>
          </div>

          {error ? (
            <p className={styles.errorMessage()} aria-live="polite">
              {t(error)}
            </p>
          ) : null}

          <div className={styles.codeSection()}>
            <label className={styles.codeLabel()} htmlFor="connect-code">
              Enter your 6-digit code
            </label>

            <div className={styles.otpWrap()}>
              <InputOTP
                id="connect-code"
                maxLength={6}
                value={code}
                onChange={handleCodeChange}
                disabled={isConnecting}
                onComplete={handleConnectSubmit}
              >
                <InputOTPGroup className={styles.otpGroup()}>
                  {['otp-0', 'otp-1', 'otp-2', 'otp-3', 'otp-4', 'otp-5'].map((key, index) => {
                    return <InputOTPSlot key={key} index={index} className={styles.otpSlot()} />
                  })}
                </InputOTPGroup>
              </InputOTP>
            </div>

            {codeError ? (
              <p className={styles.errorMessage()} aria-live="polite">
                {codeError}
              </p>
            ) : null}
          </div>

          <div className={styles.actions()}>
            <Button
              className={styles.connectButton()}
              disabled={!isCompleteConnectCode(code) || isConnecting}
              onClick={handleConnectSubmit}
              type="button"
              variant="primary"
            >
              {isConnecting ? t('connection.connecting') : t('connection.connect')}
            </Button>

            {isConnecting ? (
              <Button className={styles.cancelButton()} onClick={handleCancel} type="button" variant="secondary">
                {t('common.cancel')}
              </Button>
            ) : null}
          </div>

          {installButtonLabel && onInstallClick ? (
            <Button className={styles.installButton()} onClick={onInstallClick} type="button" variant="ghost">
              {installButtonLabel}
            </Button>
          ) : null}

          <p className={styles.footer()}>Find this code in your Conduit desktop app</p>
        </CardContent>
      </Card>
    </div>
  )
}
