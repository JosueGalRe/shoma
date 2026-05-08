import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { useConnectionFlow } from '../hooks/use-connection-flow'
import { RiftClientState } from '@/core/rift/rift-client'
import { Button, Input } from '@/components/ui'

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

  const isConnecting = status === 'connecting' || clientState === RiftClientState.CONNECTING || clientState === RiftClientState.HANDSHAKING

  const statusLabel = (() => {
    if (error) {
      return 'Connection failed'
    }

    if (clientState === RiftClientState.CONNECTING || status === 'connecting') {
      return t('connection.connectingToRift')
    }

    if (clientState === RiftClientState.HANDSHAKING) {
      return t('connection.securingConnection')
    }

    if (status === 'connected' || clientState === RiftClientState.CONNECTED) {
      return 'Connected'
    }

    return 'Ready to accept your code'
  })()

  const statusTone = error
    ? 'text-red-400'
    : clientState === RiftClientState.CONNECTING || status === 'connecting'
      ? 'text-yellow-400'
      : clientState === RiftClientState.HANDSHAKING
        ? 'text-lol-gold'
        : status === 'connected' || clientState === RiftClientState.CONNECTED
          ? 'text-green-400'
          : 'text-lol-text-secondary'

  const statusDot = error
    ? 'bg-red-400 shadow-[0_0_0_4px_rgba(248,113,113,0.12)]'
    : clientState === RiftClientState.CONNECTING || status === 'connecting'
      ? 'bg-yellow-400 shadow-[0_0_0_4px_rgba(250,204,21,0.12)]'
      : clientState === RiftClientState.HANDSHAKING
        ? 'bg-lol-gold shadow-lol-glow-gold'
        : status === 'connected' || clientState === RiftClientState.CONNECTED
          ? 'bg-green-400 shadow-[0_0_0_4px_rgba(74,222,128,0.12)]'
          : 'bg-lol-text-muted shadow-[0_0_0_4px_rgba(148,163,184,0.12)]'

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
    <div className="min-h-screen px-4 py-10 text-lol-text-primary sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-3xl items-center justify-center">
        <div className="relative w-full overflow-hidden rounded-3xl border border-lol-border-subtle bg-lol-navy-950/70 shadow-lol-shadow-lg backdrop-blur-md">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(212,175,55,0.18),transparent_35%),linear-gradient(180deg,rgba(10,16,32,0.94),rgba(4,8,20,0.98))]" />
          <div className="absolute -left-20 top-10 size-48 rounded-full bg-lol-gold/10 blur-3xl" />
          <div className="absolute -right-16 bottom-0 size-56 rounded-full bg-blue-900/20 blur-3xl" />

          <div className="relative px-5 py-10 sm:px-8 sm:py-12 lg:px-12 lg:py-14">
            <div className="mx-auto max-w-xl text-center">
              <p className="text-xs uppercase tracking-[0.45em] text-lol-gold/70">Summoner Link</p>
              <h1 className="mt-4 font-display text-5xl tracking-[0.16em] text-lol-gold drop-shadow-[0_0_16px_rgba(212,175,55,0.22)] sm:text-6xl">
                {title}
              </h1>
              <p className="mx-auto mt-4 max-w-lg text-sm leading-6 text-lol-text-secondary sm:text-base">{subtitle}</p>
            </div>

            <div className="mx-auto mt-10 max-w-md rounded-lg border border-lol-border-subtle bg-lol-navy-900/80 p-6 shadow-lol-shadow-lg backdrop-blur-sm sm:p-8">
              <div
                className="space-y-5"
              >
                <div className="space-y-3">
                  <label className="block text-center text-xs uppercase tracking-[0.35em] text-lol-text-muted" htmlFor="code-input">
                    Enter your 6-digit code
                  </label>
                  <Input
                    className="h-16 rounded-md border-lol-border-gold bg-lol-navy-950/90 text-center font-mono text-3xl tracking-[0.5em] text-lol-gold placeholder:text-lol-text-muted sm:text-4xl"
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
                  {codeError ? <p className="text-center text-sm text-red-400" aria-live="polite">{codeError}</p> : null}
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
                    className="h-12 w-full text-sm uppercase tracking-[0.2em] shadow-lol-glow-gold"
                    onClick={handleConnectSubmit}
                    disabled={code.length !== 6 || isConnecting}
                    type="button"
                    variant="primary"
                  >
                    {isConnecting ? t('connection.connecting') : t('connection.connect')}
                  </Button>
                </div>

                <div className="rounded-lg border border-lol-border-subtle bg-lol-navy-950/70 px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className={`h-2.5 w-2.5 rounded-full ${statusDot}`} />
                    <p className={`text-sm font-medium ${statusTone}`}>{statusLabel}</p>
                  </div>
                  {error ? <p className="mt-2 text-sm text-red-400" aria-live="polite">{t(error)}</p> : null}
                </div>
              </div>

              {installButtonLabel && onInstallClick ? (
                <Button className="mt-6 w-full" onClick={onInstallClick} type="button" variant="secondary">
                  {installButtonLabel}
                </Button>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
