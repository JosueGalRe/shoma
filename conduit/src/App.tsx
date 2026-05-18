import { getVersion, getTauriVersion } from '@tauri-apps/api/app'
import { invoke } from '@tauri-apps/api/core'
import { listen } from '@tauri-apps/api/event'
import { getCurrentWindow } from '@tauri-apps/api/window'
import { enable, disable, isEnabled } from '@tauri-apps/plugin-autostart'
import { open } from '@tauri-apps/plugin-shell'
import { check } from '@tauri-apps/plugin-updater'
import QRCode from 'qrcode'
import { useEffect, useReducer, useState, useRef } from 'react'

import { AmbientBackground, Button, Card, Icon, Spinner } from '@shoma/design-system'

import { UpdatePrompt } from './components/update-prompt'
import en from './i18n/en.json'
import es from './i18n/es.json'

import './style.css'

export type TranslationKey = keyof typeof en
type Translations = Record<TranslationKey, string>

const translations: Record<string, Translations> = { en, es }

const STORAGE_KEY = 'conduit-language'

const getInitialLanguage = () => {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored && stored in translations) {
    return stored
  }
  const browserLang = navigator.language.split('-')[0].toLowerCase()
  return browserLang in translations ? browserLang : 'en'
}

export const useI18n = () => {
  const [language, setLanguageState] = useState(getInitialLanguage)
  const dictionary = translations[language] ?? translations.en

  const setLanguage = (lang: string) => {
    if (lang in translations) {
      localStorage.setItem(STORAGE_KEY, lang)
      setLanguageState(lang)
    }
  }

  const t = (key: TranslationKey) => dictionary[key] ?? translations.en[key]

  return { t, language, setLanguage }
}

export const APP_NAME = en['app.name']

export type ConnectionDimensionState = 'waiting' | 'connecting' | 'connected' | 'paired'
export type ConduitErrorCode = 'lcu_unavailable' | 'relay_unreachable' | 'registration_failed' | 'server_error'

export type ConduitState = {
  relay: ConnectionDimensionState
  lcu: ConnectionDimensionState
  error: ConduitErrorCode | null
}

export const defaultConduitState: ConduitState = {
  relay: 'waiting',
  lcu: 'waiting',
  error: null,
}

type ConnectionState = {
  state: ConduitState
  code: string | null
  url: string
}

export type AppState = {
  connection: ConduitState
  accessCode: string | null
  showSettings: boolean
  isGeneratingCode: boolean
  copied: boolean
}

export type AppAction =
  | { type: 'INITIALIZE'; payload: Partial<AppState> }
  | { type: 'SET_CONNECTION'; payload: ConduitState }
  | { type: 'SET_ACCESS_CODE'; payload: string | null }
  | { type: 'SET_SHOW_SETTINGS'; payload: boolean }
  | { type: 'SET_GENERATING'; payload: boolean }
  | { type: 'SET_COPIED'; payload: boolean }

export const initialAppState: AppState = {
  connection: defaultConduitState,
  accessCode: null,
  showSettings: false,
  isGeneratingCode: false,
  copied: false,
}

export const appReducer = (state: AppState, action: AppAction): AppState => {
  switch (action.type) {
    case 'INITIALIZE':
      return { ...state, ...action.payload }
    case 'SET_CONNECTION':
      return { ...state, connection: action.payload }
    case 'SET_ACCESS_CODE':
      return { ...state, accessCode: action.payload }
    case 'SET_SHOW_SETTINGS':
      return { ...state, showSettings: action.payload }
    case 'SET_GENERATING':
      return { ...state, isGeneratingCode: action.payload }
    case 'SET_COPIED':
      return { ...state, copied: action.payload }
    default:
      return state
  }
}

type ConnectionStateChanged = {
  state: ConduitState
}

type AccessCodeChanged = {
  code: string
}

type AccessCodeGenerating = {
  generating: boolean
}

export type UpdateInfo = {
  version: string
  date: string | null
  notes: string | null
}

export const stateFromConnectionEvent = (event: ConnectionStateChanged): ConduitState => event.state

export const statusColor = (status: ConnectionDimensionState, hasError: boolean) => {
  if (hasError) {
    return 'var(--status-error)'
  }

  switch (status) {
    case 'waiting':
      return 'var(--status-waiting)'
    case 'connecting':
      return 'var(--status-starting)'
    case 'connected':
      return 'var(--status-connected)'
    case 'paired':
      return 'var(--status-paired)'
  }
}

export const statusTextKey = (status: ConnectionDimensionState): TranslationKey => {
  switch (status) {
    case 'waiting':
      return 'status.waiting'
    case 'connecting':
      return 'status.connecting'
    case 'connected':
      return 'status.connected'
    case 'paired':
      return 'status.paired'
  }
}

export const errorTextKey = (error: ConduitErrorCode): TranslationKey => {
  switch (error) {
    case 'lcu_unavailable':
      return 'error.lcuUnavailable'
    case 'relay_unreachable':
      return 'error.relayUnreachable'
    case 'registration_failed':
      return 'error.registrationFailed'
    case 'server_error':
      return 'error.serverError'
  }
}

export function SettingsPanel({
  onClose,
  onCheckUpdate,
  isCheckingUpdate,
  t,
  language,
  setLanguage,
}: {
  onClose: () => void
  onCheckUpdate: () => void
  isCheckingUpdate: boolean
  t: (key: TranslationKey) => string
  language: string
  setLanguage: (lang: string) => void
}) {
  const [launchAtStartup, setLaunchAtStartup] = useState(false)
  const [appVersion, setAppVersion] = useState<string>('')
  const [tauriVersion, setTauriVersion] = useState<string>('')

  useEffect(() => {
    const fetchVersions = async () => {
      try {
        const appVer = await getVersion()
        const tauriVer = await getTauriVersion()
        setAppVersion(appVer)
        setTauriVersion(tauriVer)
      } catch (e) {
        console.error('Failed to fetch versions', e)
      }
    }
    fetchVersions()
  }, [])

  useEffect(() => {
    const fetchAutostartStatus = async () => {
      try {
        const enabled = await isEnabled()
        setLaunchAtStartup(enabled)
      } catch (e) {
        console.error('Failed to fetch autostart status', e)
      }
    }
    fetchAutostartStatus()
  }, [])

  const handleToggleAutostart = async (checked: boolean) => {
    try {
      if (checked) {
        await enable()
      } else {
        await disable()
      }
      setLaunchAtStartup(checked)
    } catch (e) {
      console.error('Failed to toggle autostart', e)
    }
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  return (
    <div className='settings-overlay'>
      <div className='settings-header'>
        <div className='settings-title'>
          <Icon name='settings' size='sm' tone='primary' />
          {t('settings.title')}
        </div>
        <Button className='settings-back-button' onClick={onClose} variant='secondary' size='sm'>
          {t('settings.back')}
        </Button>
      </div>

      <div className='settings-content'>
        <Card className='settings-card'>
          <div className='settings-item'>
            <label className='settings-label'>
              <input
                type='checkbox'
                checked={launchAtStartup}
                onChange={(e) => handleToggleAutostart(e.target.checked)}
                className='settings-checkbox'
              />
              {t('settings.launchAtStartup')}
            </label>
          </div>

          <div className='settings-item'>
            <div className='settings-label'>{t('settings.language')}</div>
            <select value={language} onChange={(e) => setLanguage(e.target.value)} className='settings-select'>
              <option value='en'>{t('lang.en')}</option>
              <option value='es'>{t('lang.es')}</option>
            </select>
          </div>
        </Card>

        <Card className='settings-card'>
          <div className='settings-item'>
            <div className='settings-label'>{t('settings.version')}</div>
            <div className='settings-value' style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span>App: {appVersion || '...'} | Tauri: {tauriVersion || '...'}</span>
              <button
                type='button'
                onClick={() => open('https://github.com/JosueGalRe/shoma')}
                className='settings-link'
              >
                GitHub
              </button>
            </div>
            <Button variant='secondary' onClick={onCheckUpdate} disabled={isCheckingUpdate} className='mt-2 text-xs'>
              {isCheckingUpdate ? t('settings.checkingUpdate') : t('settings.checkUpdate')}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  )
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

export default function App() {
  const [state, dispatch] = useReducer(appReducer, initialAppState)
  const { t, language, setLanguage } = useI18n()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const connectionStateRef = useRef<ConnectionState | null>(null)

  const [showQR, setShowQR] = useState(false)
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null)
  const [isCheckingUpdate, setIsCheckingUpdate] = useState(false)

  const handleCheckUpdate = async () => {
    setIsCheckingUpdate(true)
    try {
      const update = await check()
      if (update?.available) {
        setUpdateInfo({
          version: update.version,
          date: update.date ?? null,
          notes: update.body ?? null,
        })
      } else {
        console.log('No update available')
      }
    } catch (e) {
      console.error('Manual update check failed:', e)
    } finally {
      setIsCheckingUpdate(false)
    }
  }

  useEffect(() => {
    const win = getCurrentWindow()
    win
      .show()
      .then(() => win.setFocus())
      .catch((e) => console.error('failed to show/focus window:', e))
  }, [])

  useEffect(() => {
    let mounted = true
    let unlisten: (() => void) | undefined

    listen<UpdateInfo>('conduit://update-available', (event) => {
      const dismissed = localStorage.getItem('conduit-dismissed-version')
      if (dismissed === event.payload.version) {
        return
      }

      setUpdateInfo({
        version: event.payload.version,
        date: event.payload.date,
        notes: event.payload.notes,
      })
    })
      .then((cleanup) => {
        if (mounted) {
          unlisten = cleanup
          return
        }

        cleanup()
      })
      .catch((error) => console.error('failed to listen for updater events', error))

    return () => {
      mounted = false
      unlisten?.()
    }
  }, [])

  useEffect(() => {
    const url = connectionStateRef.current?.url?.trim()
    if (state.accessCode && url && canvasRef.current) {
      QRCode.toCanvas(
        canvasRef.current,
        `${url.replace(/\/$/, '')}/?code=${state.accessCode}`,
        {
          width: 160,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF',
          },
        },
        (error) => {
          if (error) console.error(error)
        },
      )
    } else if (canvasRef.current) {
      const context = canvasRef.current.getContext('2d')
      context?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
    }
  }, [state.accessCode, showQR])

  useEffect(() => {
    let mounted = true
    const unlisteners: Array<() => void> = []

    Promise.all([
      listen<ConnectionStateChanged>('connection-state-changed', (event) => {
        dispatch({ type: 'SET_CONNECTION', payload: stateFromConnectionEvent(event.payload) })
      }),
      listen<AccessCodeChanged>('access-code-changed', (event) => {
        dispatch({
          type: 'INITIALIZE',
          payload: {
            accessCode: event.payload.code || null,
            isGeneratingCode: false,
          },
        })
      }),
      listen<AccessCodeGenerating>('access-code-generating', () => {
        dispatch({ type: 'SET_GENERATING', payload: true })
      }),
    ])
      .then(([unlistenState, unlistenCode, unlistenGenerating]) => {
        if (!mounted) {
          unlistenState()
          unlistenCode()
          unlistenGenerating()
          return null
        }

        unlisteners.push(unlistenState, unlistenCode, unlistenGenerating)
        return invoke<ConnectionState>('get_connection_state')
      })
      .then((connectionState) => {
        if (!connectionState || !mounted) {
          return
        }

        connectionStateRef.current = connectionState
        dispatch({
          type: 'INITIALIZE',
          payload: {
            connection: connectionState.state,
            accessCode: connectionState.code ?? null,
            isGeneratingCode: false,
          },
        })
      })
      .catch((error) => {
        console.error('failed to load connection state', error)
        if (mounted) {
          dispatch({
            type: 'INITIALIZE',
            payload: {
              connection: { ...defaultConduitState, error: 'server_error' },
              isGeneratingCode: false,
            },
          })
        }
      })

    return () => {
      mounted = false
      unlisteners.forEach((unlisten) => unlisten())
    }
  }, [])

  const handleMinimize = () => {
    getCurrentWindow().minimize()
  }

  const handleClose = () => {
    getCurrentWindow().close()
  }

  const handleCopyCode = async () => {
    if (!state.accessCode) return
    try {
      await navigator.clipboard.writeText(state.accessCode)
      dispatch({ type: 'SET_COPIED', payload: true })
      setTimeout(() => dispatch({ type: 'SET_COPIED', payload: false }), 2000)
    } catch (e) {
      console.error('failed to copy code:', e)
    }
  }

  const hasRelayError = state.connection.error === 'relay_unreachable' || state.connection.error === 'registration_failed'
  const hasLcuError = state.connection.error === 'lcu_unavailable'

  return (
    <AmbientBackground>
      <div data-tauri-drag-region className='titlebar'>
        <div className='titlebar-title'>{t('app.name')}</div>
        <div className='titlebar-controls'>
          <button
            className='titlebar-button'
            onClick={() => dispatch({ type: 'SET_SHOW_SETTINGS', payload: !state.showSettings })}
            title={t('settings.title')}
          >
            <Icon name='settings' size={12} />
          </button>
          <button className='titlebar-button' onClick={handleMinimize} title='Minimize'>
            <Icon name='minus' size={12} />
          </button>
          <button className='titlebar-button close' onClick={handleClose} title='Close'>
            <Icon name='x' size={12} />
          </button>
        </div>
      </div>
      <div className='content'>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', flexShrink: 0 }}>
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
        </div>

        <div
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px', width: '100%', flexShrink: 0 }}
        >
          {state.isGeneratingCode ? (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '12px',
                color: 'var(--shoma-primary)',
              }}
            >
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

              <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
                {!showQR && (
                  <Button
                    className='copy-button'
                    onClick={handleCopyCode}
                    disabled={!state.accessCode || state.copied}
                    title={t('button.copy')}
                    variant='primary'
                  >
                    <Icon name={state.copied ? 'check' : 'copy'} size='sm' tone='primary' />
                    {state.copied ? t('button.copied') : t('button.copy')}
                  </Button>
                )}
                <Button variant='secondary' onClick={() => setShowQR(!showQR)} className='qr-toggle-button'>
                  <Icon name={showQR ? 'hash' : 'qr-code'} size='sm' />
                  {showQR ? t('button.showCode') : t('button.showQR')}
                </Button>
              </div>
            </>
          )}
        </div>
      </div>

      {state.showSettings && (
        <SettingsPanel
          onClose={() => dispatch({ type: 'SET_SHOW_SETTINGS', payload: false })}
          onCheckUpdate={handleCheckUpdate}
          isCheckingUpdate={isCheckingUpdate}
          t={t}
          language={language}
          setLanguage={setLanguage}
        />
      )}

      {updateInfo && (
        <UpdatePrompt
          version={updateInfo.version}
          date={updateInfo.date ?? undefined}
          notes={updateInfo.notes ?? undefined}
          onDismiss={() => {
            localStorage.setItem('conduit-dismissed-version', updateInfo.version)
            setUpdateInfo(null)
          }}
        />
      )}
    </AmbientBackground>
  )
}
