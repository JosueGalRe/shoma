import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { useConnectionFlow } from '../hooks/use-connection-flow'
import { RelayClientState } from '@/core/relay/relay-client'
import { Button, Card, CardContent } from '@/components/ui'
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp'

type ConnectScreenProps = {
  installButtonLabel?: string
  onInstallClick?: () => void
  subtitle: string
  title: string
}

export function ConnectScreen({ installButtonLabel, onInstallClick, title }: ConnectScreenProps) {
  const { t } = useTranslation()
  const [codeError, setCodeError] = useState<string | null>(null)
  const {
    code,
    setCode,
    status,
    clientState,
    error,
    handleConnect,
    handleCancel,
  } = useConnectionFlow()

  const isConnecting = status === 'connecting' || clientState === RelayClientState.CONNECTING || clientState === RelayClientState.HANDSHAKING

  const statusTone = error
    ? 'text-destructive'
    : clientState === RelayClientState.CONNECTING || status === 'connecting'
      ? 'text-accent'
      : clientState === RelayClientState.HANDSHAKING
        ? 'text-primary'
        : status === 'connected' || clientState === RelayClientState.CONNECTED
          ? 'text-primary'
          : 'text-muted'

  const handleCodeChange = (value: string) => {
    setCode(value)
    if (codeError && value.length === 6) {
      setCodeError(null)
    }
  }

  const handleConnectSubmit = () => {
    if (code.length !== 6) {
      setCodeError(t('connection.errors.invalidCode'))
      return
    }
    setCodeError(null)
    handleConnect(code)
  }

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-10">
      <Card className="w-full max-w-sm border border-border-gold/30 bg-surface/60 shadow-[0_0_50px_rgba(200,170,110,0.25)] backdrop-blur-2xl">
          <CardContent className="flex flex-col items-center gap-5 px-6 pt-12 pb-6">
            <div className="text-center">
              <h1 className="font-display text-5xl font-black tracking-wider text-primary drop-shadow-[0_0_15px_rgba(200,170,110,0.4)]">
                {title}
              </h1>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative flex h-3 w-3 items-center justify-center">
                <span className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-40 ${error ? 'bg-destructive' : clientState === RelayClientState.CONNECTING ? 'bg-accent' : clientState === RelayClientState.HANDSHAKING ? 'bg-primary' : status === 'connected' ? 'bg-primary' : 'bg-muted'}`} />
                <span className={`relative inline-flex h-2 w-2 rounded-full ${error ? 'bg-destructive' : clientState === RelayClientState.CONNECTING ? 'bg-accent' : clientState === RelayClientState.HANDSHAKING ? 'bg-primary' : status === 'connected' ? 'bg-primary' : 'bg-muted'}`} />
              </div>
              <span className={`text-xs font-medium uppercase tracking-wider ${statusTone}`}>
                {error ? 'Connection failed' : clientState === RelayClientState.CONNECTING ? t('connection.connectingToRelay') : clientState === RelayClientState.HANDSHAKING ? t('connection.securingConnection') : status === 'connected' ? 'Connected' : 'Ready'}
              </span>
            </div>

            {error ? (
              <p className="text-center text-sm text-destructive" aria-live="polite">{t(error)}</p>
            ) : null}

            <div className="w-full space-y-2 text-center">
              <label className="block text-xs uppercase tracking-[0.35em] text-muted">
                Enter your 6-digit code
              </label>

              <div className="flex justify-center py-2">
                <InputOTP
                  maxLength={6}
                  value={code}
                  onChange={handleCodeChange}
                  disabled={isConnecting}
                  onComplete={handleConnectSubmit}
                >
                  <InputOTPGroup className="gap-4">
                    {[0, 1, 2, 3, 4, 5].map((i) => (
                      <InputOTPSlot
                        key={i}
                        index={i}
                        className="h-11 w-10 rounded border border-border-gold/50 bg-surface-elevated/50 text-center text-xl font-medium text-text backdrop-blur-sm shadow-inner data-[active=true]:border-primary data-[active=true]:ring-2 data-[active=true]:ring-primary/50"
                      />
                    ))}
                  </InputOTPGroup>
                </InputOTP>
              </div>

              {codeError ? (
                <p className="text-center text-sm text-destructive" aria-live="polite">{codeError}</p>
              ) : null}
            </div>

            <div className="flex w-full flex-col gap-3">
              <Button
                className="h-12 w-full uppercase tracking-[0.2em] font-bold border-primary hover:shadow-[0_0_15px_rgba(200,170,110,0.5)] active:scale-[0.98]"
                disabled={code.length !== 6 || isConnecting}
                onClick={handleConnectSubmit}
                type="button"
                variant="primary"
              >
                {isConnecting ? t('connection.connecting') : t('connection.connect')}
              </Button>

              {isConnecting ? (
                <Button
                  className="h-12 w-full uppercase tracking-widest font-bold active:scale-[0.98]"
                  onClick={handleCancel}
                  type="button"
                  variant="secondary"
                >
                  {t('common.cancel')}
                </Button>
              ) : null}
            </div>

            {installButtonLabel && onInstallClick ? (
              <Button className="w-full" onClick={onInstallClick} type="button" variant="ghost">
                {installButtonLabel}
              </Button>
            ) : null}

            <p className="text-center text-[10px] uppercase tracking-widest text-muted/60">
              Find this code in your Conduit desktop app
            </p>
          </CardContent>
        </Card>
    </div>
  )
}
