import { useEffect } from 'react'
import QRCode from 'qrcode'

import { Button, Card, Icon, Spinner, AmbientBackground } from '@shoma/design-system'

import { AppState, ConduitState, statusColor, statusTextKey, errorTextKey, TranslationKey } from '../App'

type VariantProps = {
  state: AppState
  t: (key: TranslationKey) => string
  hasRelayError: boolean
  hasLcuError: boolean
  showQR: boolean
  setShowQR: (show: boolean) => void
  handleCopyCode: () => void
  canvasRef: React.RefObject<HTMLCanvasElement | null>
  url?: string
}

function PillStatus({
  label,
  status,
  hasError,
  t,
}: {
  label: string
  status: ConduitState['relay']
  hasError: boolean
  t: (key: TranslationKey) => string
}) {
  const color = statusColor(status, hasError)
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '6px 14px',
        borderRadius: '999px',
        background: `color-mix(in srgb, ${color} 12%, transparent)`,
        border: `1px solid color-mix(in srgb, ${color} 25%, transparent)`,
        fontSize: '11px',
        backdropFilter: 'blur(8px)',
      }}
    >
      <div
        style={{
          width: '7px',
          height: '7px',
          borderRadius: '50%',
          backgroundColor: color,
          boxShadow: `0 0 10px ${color}`,
        }}
      />
      <span style={{ color: 'var(--shoma-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: '10px' }}>
        {label}
      </span>
      <span style={{ color, fontWeight: 600 }}>{t(statusTextKey(status))}</span>
    </div>
  )
}

export function VariantD({ state, t, hasRelayError, hasLcuError, showQR, setShowQR, handleCopyCode, canvasRef, url }: VariantProps) {
  useEffect(() => {
    if (showQR && canvasRef.current && url && state.accessCode) {
      QRCode.toCanvas(
        canvasRef.current,
        `${url.replace(/\/$/, '')}/?code=${state.accessCode}`,
        { width: 160, margin: 2, color: { dark: '#000000', light: '#FFFFFF' } },
        (err) => { if (err) console.error(err) }
      )
    }
  }, [showQR, canvasRef, url, state.accessCode])

  return (
    <AmbientBackground>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          height: '100%',
          gap: '28px',
          padding: '24px',
          paddingBottom: '100px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <PillStatus label={t('status.relay')} status={state.connection.relay} hasError={hasRelayError} t={t} />
          <PillStatus label={t('status.lcu')} status={state.connection.lcu} hasError={hasLcuError} t={t} />
        </div>

        {state.connection.error && (
          <div
            style={{
              color: 'var(--status-error)',
              fontSize: '12px',
              textAlign: 'center',
              background: 'color-mix(in srgb, var(--status-error) 10%, transparent)',
              padding: '6px 14px',
              borderRadius: '8px',
              border: '1px solid color-mix(in srgb, var(--status-error) 20%, transparent)',
            }}
          >
            {t(errorTextKey(state.connection.error))}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', flex: 1, justifyContent: 'center' }}>
          {state.isGeneratingCode ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', color: 'var(--shoma-primary)' }}>
              <Spinner label={t('status.generating')} />
              <span style={{ fontSize: '13px', letterSpacing: '0.05em' }}>{t('status.generating')}</span>
            </div>
          ) : (
            <>
              {showQR ? (
                <div
                  style={{
                    background: '#ffffff',
                    padding: '16px',
                    borderRadius: '16px',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                  }}
                >
                  <canvas ref={canvasRef} style={{ display: 'block', width: '160px', height: '160px' }}></canvas>
                </div>
              ) : (
                <div
                  style={{
                    fontSize: '52px',
                    fontWeight: 'var(--shoma-font-weight-bold)',
                    letterSpacing: '0.12em',
                    color: 'var(--shoma-primary)',
                    fontFamily: 'var(--shoma-font-family-mono)',
                    textShadow: '0 0 40px var(--conduit-glow-primary)',
                  }}
                >
                  {(state.accessCode ?? '------').split('').join(' ')}
                </div>
              )}

              <div style={{ display: 'flex', gap: '12px', width: '100%', justifyContent: 'center' }}>
                {!showQR && (
                  <Button
                    className='copy-button'
                    onClick={handleCopyCode}
                    disabled={!state.accessCode || state.copied}
                    title={t('button.copy')}
                    variant='primary'
                    style={{ flex: 1, maxWidth: '140px', margin: 0 }}
                  >
                    <Icon name={state.copied ? 'check' : 'copy'} size='sm' tone='primary' />
                    {state.copied ? t('button.copied') : t('button.copy')}
                  </Button>
                )}
                <Button
                  variant='secondary'
                  onClick={() => setShowQR(!showQR)}
                  className='qr-toggle-button'
                  style={{ flex: showQR ? 1 : 'auto', maxWidth: showQR ? '140px' : undefined, margin: 0 }}
                >
                  <Icon name={showQR ? 'hash' : 'qr-code'} size='sm' />
                  {showQR ? t('button.showCode') : t('button.showQR')}
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </AmbientBackground>
  )
}
