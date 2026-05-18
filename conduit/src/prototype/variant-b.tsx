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
        gap: '6px',
        padding: '4px 10px',
        borderRadius: '999px',
        background: `color-mix(in srgb, ${color} 15%, transparent)`,
        border: `1px solid color-mix(in srgb, ${color} 30%, transparent)`,
        fontSize: '11px',
      }}
    >
      <div
        style={{
          width: '6px',
          height: '6px',
          borderRadius: '50%',
          backgroundColor: color,
          boxShadow: `0 0 8px ${color}`,
        }}
      />
      <span style={{ color: 'var(--shoma-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>
      <span style={{ color, fontWeight: 500 }}>{t(statusTextKey(status))}</span>
    </div>
  )
}

export function VariantB({ state, t, hasRelayError, hasLcuError, showQR, setShowQR, handleCopyCode, canvasRef }: VariantProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', maxWidth: '320px', gap: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
        <PillStatus label={t('status.relay')} status={state.connection.relay} hasError={hasRelayError} t={t} />
        <PillStatus label={t('status.lcu')} status={state.connection.lcu} hasError={hasLcuError} t={t} />
      </div>

      {state.connection.error && <div className='status-error'>{t(errorTextKey(state.connection.error))}</div>}

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        {state.isGeneratingCode ? (
          <div className='generating-state'>
            <Spinner label={t('status.generating')} />
            <div>{t('status.generating')}</div>
          </div>
        ) : (
          <>
            {showQR ? (
              <div className='qr-container' style={{ marginBottom: '24px' }}>
                <canvas ref={canvasRef} className='qr-canvas'></canvas>
              </div>
            ) : (
              <div
                className='access-code'
                style={{
                  fontSize: '48px',
                  marginBottom: '24px',
                  textShadow: '0 0 24px var(--conduit-glow-primary)',
                }}
              >
                {(state.accessCode ?? '------').split('').join(' ')}
              </div>
            )}

            <div style={{ display: 'flex', gap: '16px' }}>
              {!showQR && (
                <button
                  onClick={handleCopyCode}
                  disabled={!state.accessCode || state.copied}
                  title={t('button.copy')}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '8px',
                    background: 'transparent',
                    border: 'none',
                    color: state.copied ? 'var(--shoma-primary)' : 'var(--shoma-text)',
                    cursor: !state.accessCode || state.copied ? 'default' : 'pointer',
                    opacity: !state.accessCode || state.copied ? 0.5 : 1,
                  }}
                >
                  <div
                    style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '50%',
                      background: 'color-mix(in srgb, var(--conduit-surface) 80%, transparent)',
                      border: '1px solid var(--conduit-border-subtle)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Icon name={state.copied ? 'check' : 'copy'} size='sm' tone={state.copied ? 'primary' : undefined} />
                  </div>
                  <span style={{ fontSize: '11px', color: 'var(--shoma-muted)' }}>
                    {state.copied ? t('button.copied') : t('button.copy')}
                  </span>
                </button>
              )}
              <button
                onClick={() => setShowQR(!showQR)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '8px',
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--shoma-text)',
                  cursor: 'pointer',
                }}
              >
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    background: 'color-mix(in srgb, var(--conduit-surface) 80%, transparent)',
                    border: '1px solid var(--conduit-border-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Icon name={showQR ? 'hash' : 'qr-code'} size='sm' />
                </div>
                <span style={{ fontSize: '11px', color: 'var(--shoma-muted)' }}>
                  {showQR ? t('button.showCode') : t('button.showQR')}
                </span>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
