import { useEffect } from 'react'
import QRCode from 'qrcode'

import { Button, Card, Icon, Spinner } from '@shoma/design-system'

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

function CompactStatus({
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
        padding: '6px 12px',
        borderRadius: '8px',
        background: 'color-mix(in srgb, var(--conduit-surface) 50%, transparent)',
        border: '1px solid var(--conduit-border-subtle)',
        flex: 1,
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          backgroundColor: color,
          boxShadow: `0 0 8px ${color}`,
        }}
      />
      <div style={{ display: 'flex', gap: '6px', alignItems: 'baseline', fontSize: '12px' }}>
        <span style={{ color: 'var(--shoma-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '10px' }}>
          {label}
        </span>
        <span style={{ color, fontWeight: 500 }}>{t(statusTextKey(status))}</span>
      </div>
    </div>
  )
}

export function VariantA({ state, t, hasRelayError, hasLcuError, showQR, setShowQR, handleCopyCode, canvasRef, url }: VariantProps) {
  useEffect(() => {
    if (showQR && canvasRef.current && url && state.accessCode) {
      QRCode.toCanvas(
        canvasRef.current,
        `${url.replace(/\/$/, '')}/?code=${state.accessCode}`,
        { width: 140, margin: 0, color: { dark: '#000000', light: '#FFFFFF' } },
        (err) => { if (err) console.error(err) }
      )
    }
  }, [showQR, canvasRef, url, state.accessCode])
  return (
    <Card
      className='main-card'
      style={{ display: 'flex', flexDirection: 'column', gap: '24px', padding: '24px', width: '100%', maxWidth: '320px' }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', gap: '12px' }}>
        <CompactStatus label={t('status.relay')} status={state.connection.relay} hasError={hasRelayError} t={t} />
        <CompactStatus label={t('status.lcu')} status={state.connection.lcu} hasError={hasLcuError} t={t} />
      </div>

      {state.connection.error && <div className='status-error'>{t(errorTextKey(state.connection.error))}</div>}

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, justifyContent: 'center', paddingBottom: '80px' }}>
        {state.isGeneratingCode ? (
          <div className='generating-state'>
            <Spinner label={t('status.generating')} />
            <div>{t('status.generating')}</div>
          </div>
        ) : (
          <>
            {showQR ? (
              <div style={{ marginBottom: '16px', background: '#ffffff', padding: '12px', borderRadius: '12px', boxShadow: '0 0 16px var(--conduit-glow-primary)' }}>
                <canvas ref={canvasRef} style={{ display: 'block', width: '140px', height: '140px' }}></canvas>
              </div>
            ) : (
              <div className='access-code' style={{ fontSize: '42px', marginBottom: '24px' }}>
                {(state.accessCode ?? '------').split('').join(' ')}
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px', width: '100%' }}>
              {!showQR && (
                <Button
                  className='copy-button'
                  onClick={handleCopyCode}
                  disabled={!state.accessCode || state.copied}
                  title={t('button.copy')}
                  variant='primary'
                  style={{ flex: 1, margin: 0 }}
                >
                  <Icon name={state.copied ? 'check' : 'copy'} size='sm' tone='primary' />
                  {state.copied ? t('button.copied') : t('button.copy')}
                </Button>
              )}
              <Button
                variant='secondary'
                onClick={() => setShowQR(!showQR)}
                className='qr-toggle-button'
                style={{ flex: showQR ? 1 : 'auto', margin: 0 }}
              >
                <Icon name={showQR ? 'hash' : 'qr-code'} size='sm' />
                {showQR ? t('button.showCode') : t('button.showQR')}
              </Button>
            </div>
          </>
        )}
      </div>
    </Card>
  )
}
