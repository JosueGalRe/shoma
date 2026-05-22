import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Button, Card, CardContent } from '@/components/ui'
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp'
import { RelayClientState } from '@/core/relay/relay-client'

import { useConnectionFlow } from '../hooks/use-connection-flow'

type ConnectScreenProps = {
  installButtonLabel?: string
  onInstallClick?: () => void
  subtitle: string
  title: string
}

export function ConnectScreen({ installButtonLabel, onInstallClick, title }: ConnectScreenProps) {
  const { t } = useTranslation()
  const [codeError, setCodeError] = useState<string | null>(null)
  const { code, setCode, status, clientState, error, handleConnect, handleCancel } = useConnectionFlow()

  const isConnecting =
    status === 'connecting' || clientState === RelayClientState.CONNECTING || clientState === RelayClientState.HANDSHAKING

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
    <div className='flex flex-1 items-center justify-center px-4 py-10'>
      <Card className='border-border-gold/30 bg-surface/60 w-full max-w-sm border shadow-[0_0_50px_rgba(200,170,110,0.25)] backdrop-blur-2xl'>
        <CardContent className='flex flex-col items-center gap-5 px-6 pt-12 pb-6'>
          <div className='text-center'>
            <h1 className='font-display text-primary text-5xl font-semibold tracking-wider drop-shadow-[0_0_15px_rgba(200,170,110,0.4)]'>
              {title}
            </h1>
          </div>

          <div className='flex items-center gap-2'>
            <div className='relative flex size-3 items-center justify-center'>
              <span
                className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-40 ${error ? 'bg-destructive' : clientState === RelayClientState.CONNECTING ? 'bg-accent' : clientState === RelayClientState.HANDSHAKING ? 'bg-primary' : status === 'connected' ? 'bg-primary' : 'bg-muted'}`}
              />
              <span
                className={`relative inline-flex size-2 rounded-full ${error ? 'bg-destructive' : clientState === RelayClientState.CONNECTING ? 'bg-accent' : clientState === RelayClientState.HANDSHAKING ? 'bg-primary' : status === 'connected' ? 'bg-primary' : 'bg-muted'}`}
              />
            </div>
            <span className={`text-xs font-medium tracking-wider uppercase ${statusTone}`}>
              {error
                ? 'Connection failed'
                : clientState === RelayClientState.CONNECTING
                  ? t('connection.connectingToRelay')
                  : clientState === RelayClientState.HANDSHAKING
                    ? t('connection.securingConnection')
                    : status === 'connected'
                      ? 'Connected'
                      : 'Ready'}
            </span>
          </div>

          {error ? (
            <p className='text-destructive text-center text-sm' aria-live='polite'>
              {t(error)}
            </p>
          ) : null}

          <div className='w-full space-y-2 text-center'>
            <label className='text-muted block text-xs tracking-[0.35em] uppercase'>Enter your 6-digit code</label>

            <div className='flex justify-center py-2'>
              <InputOTP
                maxLength={6}
                value={code}
                onChange={handleCodeChange}
                disabled={isConnecting}
                onComplete={handleConnectSubmit}
              >
                <InputOTPGroup className='gap-4'>
                  {['otp-0', 'otp-1', 'otp-2', 'otp-3', 'otp-4', 'otp-5'].map((key, index) => (
                    <InputOTPSlot
                      key={key}
                      index={index}
                      className='border-border-gold/50 bg-surface-elevated/50 text-text data-[active=true]:border-primary data-[active=true]:ring-primary/50 h-11 w-10 rounded border text-center text-xl font-medium shadow-inner backdrop-blur-sm data-[active=true]:ring-2'
                    />
                  ))}
                </InputOTPGroup>
              </InputOTP>
            </div>

            {codeError ? (
              <p className='text-destructive text-center text-sm' aria-live='polite'>
                {codeError}
              </p>
            ) : null}
          </div>

          <div className='flex w-full flex-col gap-3'>
            <Button
              className='border-primary h-12 w-full font-bold tracking-[0.2em] uppercase hover:shadow-[0_0_15px_rgba(200,170,110,0.5)] active:scale-[0.98]'
              disabled={code.length !== 6 || isConnecting}
              onClick={handleConnectSubmit}
              type='button'
              variant='primary'
            >
              {isConnecting ? t('connection.connecting') : t('connection.connect')}
            </Button>

            {isConnecting ? (
              <Button
                className='h-12 w-full font-bold tracking-widest uppercase active:scale-[0.98]'
                onClick={handleCancel}
                type='button'
                variant='secondary'
              >
                {t('common.cancel')}
              </Button>
            ) : null}
          </div>

          {installButtonLabel && onInstallClick ? (
            <Button className='w-full' onClick={onInstallClick} type='button' variant='ghost'>
              {installButtonLabel}
            </Button>
          ) : null}

          <p className='text-muted/60 text-center text-[10px] tracking-widest uppercase'>
            Find this code in your Conduit desktop app
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
