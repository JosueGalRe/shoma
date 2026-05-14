import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { useConnectionFlow } from '../hooks/use-connection-flow'
import { RelayClientState } from '@/core/relay/relay-client'
import { Button, Card, CardContent, Input } from '@/components/ui'
import shomaLogoUrl from '../../../../../assets/shoma-logo.svg'

type ConnectScreenProps = {
  installButtonLabel?: string
  onInstallClick?: () => void
  subtitle: string
  title: string
}

export function ConnectScreen({ installButtonLabel, onInstallClick, subtitle, title }: ConnectScreenProps) {
  const { t } = useTranslation()
  const [codeError, setCodeError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)
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

  const statusLabel = (() => {
    if (error) {
      return 'Connection failed'
    }

    if (clientState === RelayClientState.CONNECTING || status === 'connecting') {
      return t('connection.connectingToRelay')
    }

    if (clientState === RelayClientState.HANDSHAKING) {
      return t('connection.securingConnection')
    }

    if (status === 'connected' || clientState === RelayClientState.CONNECTED) {
      return 'Connected'
    }

    return 'Ready to accept your code'
  })()

  const statusTone = error
    ? 'text-destructive'
    : clientState === RelayClientState.CONNECTING || status === 'connecting'
      ? 'text-accent'
      : clientState === RelayClientState.HANDSHAKING
        ? 'text-primary'
        : status === 'connected' || clientState === RelayClientState.CONNECTED
          ? 'text-primary'
          : 'text-muted'

  const statusDot = error
    ? 'bg-destructive shadow-[0_0_0_4px_var(--shoma-destructive)]'
    : clientState === RelayClientState.CONNECTING || status === 'connecting'
      ? 'bg-accent shadow-[0_0_0_4px_var(--shoma-accent)]'
      : clientState === RelayClientState.HANDSHAKING
        ? 'bg-primary shadow-[0_0_20px_var(--shoma-primary)]'
        : status === 'connected' || clientState === RelayClientState.CONNECTED
          ? 'bg-primary shadow-[0_0_0_4px_var(--shoma-primary)]'
          : 'bg-muted shadow-[0_0_0_4px_var(--shoma-border)]'

  const handleCodeChange = (value: string) => {
    setCode(value)

    if (codeError && value.length === 6) {
      setCodeError(null)
    }
  }

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const handleConnectSubmit = () => {
    if (code.length !== 6) {
      setCodeError(t('connection.errors.invalidCode'))
      return
    }

    setCodeError(null)
    handleConnect(code)
  }

  return (
    <div className="min-h-screen px-4 py-10 text-foreground sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-3xl items-center justify-center">
        <Card className="relative w-full overflow-hidden rounded-3xl border-border bg-background/80 shadow-[0_0_32px_color-mix(in_srgb,var(--shoma-primary)_18%,transparent)]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,var(--shoma-primary)_0%,transparent_34%),linear-gradient(180deg,var(--shoma-secondary),var(--shoma-background))] opacity-20" />
          <div className="absolute -left-20 top-10 size-48 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute -right-16 bottom-0 size-56 rounded-full bg-accent/10 blur-2xl" />

          <CardContent className="relative px-5 py-10 sm:px-8 sm:py-12 lg:px-12 lg:py-14">
            <div className="mx-auto max-w-xl text-center">
              <img className="mx-auto size-20" src={shomaLogoUrl} alt="Sho'ma logo" />
              <p className="mt-5 text-xs uppercase tracking-[0.45em] text-accent">Sho'ma Link</p>
              <h1 className="mt-3 font-display text-5xl tracking-[0.16em] text-primary drop-shadow-[0_0_16px_var(--shoma-primary)] sm:text-6xl">
                {title}
              </h1>
              <p className="mx-auto mt-4 max-w-lg text-sm leading-6 text-muted sm:text-base">{subtitle}</p>
            </div>

            <div className="mx-auto mt-10 max-w-md rounded-lg border border-border bg-secondary/90 p-6 shadow-lg sm:p-8">
              <div
                className="space-y-5"
              >
                <div className="space-y-3">
                  <label className="block text-center text-xs uppercase tracking-[0.35em] text-muted" htmlFor="code-input">
                    Enter your 6-digit code
                  </label>
                  <Input
                    className="h-16 rounded-md border-primary bg-background/90 text-center font-mono text-3xl tracking-[0.5em] text-primary placeholder:text-muted sm:text-4xl"
                    disabled={isConnecting}
                    id="code-input"
                    inputMode="numeric"
                    maxLength={6}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        handleConnectSubmit()
                      }
                    }}
                    onChange={(event) => handleCodeChange(event.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="000000"
                    ref={inputRef}
                    type="text"
                    value={code}
                  />
                  {codeError ? <p className="text-center text-sm text-destructive" aria-live="polite">{codeError}</p> : null}
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <Button
                    className="h-12 w-full text-sm uppercase tracking-[0.2em]"
                    onClick={handleCancel}
                    type="button"
                    variant="secondary"
                  >
                    {t('common.cancel')}
                  </Button>
                  <Button
                    className="h-12 w-full text-sm uppercase tracking-[0.2em] shadow-[0_0_20px_var(--shoma-primary)]"
                    onClick={handleConnectSubmit}
                    disabled={code.length !== 6 || isConnecting}
                    type="button"
                    variant="primary"
                  >
                    {isConnecting ? t('connection.connecting') : t('connection.connect')}
                  </Button>
                </div>

                <div className="rounded-lg border border-border bg-background/70 px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className={`h-2.5 w-2.5 rounded-full ${statusDot}`} />
                    <p className={`text-sm font-medium ${statusTone}`}>{statusLabel}</p>
                  </div>
                  {error ? <p className="mt-2 text-sm text-destructive" aria-live="polite">{t(error)}</p> : null}
                </div>
              </div>

              {installButtonLabel && onInstallClick ? (
                <Button className="mt-6 w-full" onClick={onInstallClick} type="button" variant="secondary">
                  {installButtonLabel}
                </Button>
              ) : null}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
