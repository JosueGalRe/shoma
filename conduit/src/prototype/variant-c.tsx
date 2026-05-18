import { Button, Card, Icon, Spinner } from '@shoma/design-system'

import { AppState, ConduitState, statusColor, errorTextKey, TranslationKey } from '../App'

type VariantProps = {
  state: AppState
  t: (key: TranslationKey) => string
  hasRelayError: boolean
  hasLcuError: boolean
  showQR: boolean
  setShowQR: (show: boolean) => void
  handleCopyCode: () => void
  canvasRef: React.RefObject<HTMLCanvasElement | null>
}

function DotStatus({ status, hasError, title }: { status: ConduitState['relay']; hasError: boolean; title: string }) {
  const color = statusColor(status, hasError)
  return (
    <div
      title={title}
      style={{
        width: '8px',
        height: '8px',
        borderRadius: '50%',
        backgroundColor: color,
        boxShadow: `0 0 12px ${color}`,
      }}
    />
  )
}

export function VariantC({ state, t, hasRelayError, hasLcuError, showQR, setShowQR, handleCopyCode, canvasRef }: VariantProps) {
  return (
    <div style={{ position: 'relative', width: '100%', maxWidth: '300px' }}>
      <div
        style={{
          position: 'absolute',
          top: '-24px',
          left: '0',
          right: '0',
          display: 'flex',
          justifyContent: 'space-between',
          padding: '0 12px',
        }}
      >
        <DotStatus status={state.connection.relay} hasError={hasRelayError} title={t('status.relay')} />
        <DotStatus status={state.connection.lcu} hasError={hasLcuError} title={t('status.lcu')} />
      </div>

      {state.connection.error && (
        <div className='status-error' style={{ position: 'absolute', top: '-48px', width: '100%' }}>
          {t(errorTextKey(state.connection.error))}
        </div>
      )}

      <div
        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '160px' }}
      >
        {state.isGeneratingCode ? (
          <div className='generating-state'>
            <Spinner label={t('status.generating')} />
          </div>
        ) : (
          <>
            {showQR ? (
              <div className='qr-container' style={{ background: 'transparent', boxShadow: 'none', padding: 0 }}>
                <canvas ref={canvasRef} className='qr-canvas' style={{ borderRadius: '12px' }}></canvas>
              </div>
            ) : (
              <div
                className='access-code'
                style={{
                  fontSize: '56px',
                  lineHeight: 1,
                  margin: 0,
                  letterSpacing: '0.15em',
                  textShadow: '0 0 32px var(--conduit-glow-primary)',
                }}
              >
                {state.accessCode ?? '------'}
              </div>
            )}

            <div style={{ display: 'flex', gap: '24px', marginTop: '32px' }}>
              {!showQR && (
                <button
                  onClick={handleCopyCode}
                  disabled={!state.accessCode || state.copied}
                  title={t('button.copy')}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: state.copied ? 'var(--shoma-primary)' : 'var(--shoma-muted)',
                    cursor: !state.accessCode || state.copied ? 'default' : 'pointer',
                    padding: '8px',
                    transition: 'color 0.2s',
                  }}
                >
                  <Icon name={state.copied ? 'check' : 'copy'} size='sm' tone={state.copied ? 'primary' : undefined} />
                </button>
              )}
              <button
                onClick={() => setShowQR(!showQR)}
                title={showQR ? t('button.showCode') : t('button.showQR')}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--shoma-muted)',
                  cursor: 'pointer',
                  padding: '8px',
                  transition: 'color 0.2s',
                }}
              >
                <Icon name={showQR ? 'hash' : 'qr-code'} size='sm' />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
