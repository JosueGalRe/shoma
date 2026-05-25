import { useEffect, useReducer, useRef, useState } from 'react'

import { AmbientBackground, Button, Icon } from '@shoma/design-system'
import { invoke } from '@tauri-apps/api/core'
import { listen } from '@tauri-apps/api/event'
import { getCurrentWindow } from '@tauri-apps/api/window'
import { check } from '@tauri-apps/plugin-updater'
import QRCode from 'qrcode'

import { ErrorBanner } from './components/error-banner'
import { GeneratingState } from './components/generating-state'
import { PillStatus } from './components/pill-status'
import { SettingsPanel } from './components/settings-panel'
import { UpdatePrompt } from './components/update-prompt'
import en from './i18n/en.json'
import es from './i18n/es.json'
// eslint-disable-next-line import/no-unassigned-import -- Vite CSS entrypoint side effect.
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
  const [language, setLanguage] = useState(getInitialLanguage)
  const dictionary = translations[language] ?? translations.en

  const updateLanguage = (lang: string) => {
    if (lang in translations) {
      localStorage.setItem(STORAGE_KEY, lang)
      setLanguage(lang)
    }
  }

  const t = (key: TranslationKey) => {
    return dictionary[key] ?? translations.en[key]
  }

  return { language, setLanguage: updateLanguage, t }
}

export const APP_NAME = en['app.name']

export type ConnectionDimensionState = 'waiting' | 'connecting' | 'connected' | 'paired'
export type ConduitErrorCode = 'lcu_unavailable' | 'relay_unreachable' | 'registration_failed' | 'server_error'

export interface ConduitState {
  relay: ConnectionDimensionState
  lcu: ConnectionDimensionState
  error: ConduitErrorCode | null
}

export const defaultConduitState: ConduitState = {
  error: null,
  lcu: 'waiting',
  relay: 'waiting',
}

interface ConnectionState {
  state: ConduitState
  code: string | null
  url: string
}

export interface AppState {
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
  accessCode: null,
  connection: defaultConduitState,
  copied: false,
  isGeneratingCode: false,
  showSettings: false,
}

export const appReducer = (state: AppState, action: AppAction): AppState => {
  switch (action.type) {
    case 'INITIALIZE': {
      return { ...state, ...action.payload }
    }
    case 'SET_CONNECTION': {
      return { ...state, connection: action.payload }
    }
    case 'SET_ACCESS_CODE': {
      return { ...state, accessCode: action.payload }
    }
    case 'SET_SHOW_SETTINGS': {
      return { ...state, showSettings: action.payload }
    }
    case 'SET_GENERATING': {
      return { ...state, isGeneratingCode: action.payload }
    }
    case 'SET_COPIED': {
      return { ...state, copied: action.payload }
    }
    default: {
      return state
    }
  }
}

interface ConnectionStateChanged {
  state: ConduitState
}

interface AccessCodeChanged {
  code: string
}

interface AccessCodeGenerating {
  generating: boolean
}

export interface UpdateInfo {
  version: string
  date: string | null
  notes: string | null
}

export const stateFromConnectionEvent = (event: ConnectionStateChanged): ConduitState => {
  return event.state
}

export const statusColor = (status: ConnectionDimensionState, hasError: boolean) => {
  if (hasError) {
    return 'var(--status-error)'
  }

  switch (status) {
    case 'waiting': {
      return 'var(--status-waiting)'
    }
    case 'connecting': {
      return 'var(--status-starting)'
    }
    case 'connected': {
      return 'var(--status-connected)'
    }
    case 'paired': {
      return 'var(--status-paired)'
    }
    default: {
      return 'var(--status-waiting)'
    }
  }
}

export const statusTextKey = (status: ConnectionDimensionState): TranslationKey => {
  switch (status) {
    case 'waiting': {
      return 'status.waiting'
    }
    case 'connecting': {
      return 'status.connecting'
    }
    case 'connected': {
      return 'status.connected'
    }
    case 'paired': {
      return 'status.paired'
    }
    default: {
      return 'status.waiting'
    }
  }
}

export const errorTextKey = (error: ConduitErrorCode): TranslationKey => {
  switch (error) {
    case 'lcu_unavailable': {
      return 'error.lcuUnavailable'
    }
    case 'relay_unreachable': {
      return 'error.relayUnreachable'
    }
    case 'registration_failed': {
      return 'error.registrationFailed'
    }
    case 'server_error': {
      return 'error.serverError'
    }
    default: {
      return 'error.serverError'
    }
  }
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
          date: update.date ?? null,
          notes: update.body ?? null,
          version: update.version,
        })
      } else {
        console.log('No update available')
      }
    } catch (error) {
      console.error('Manual update check failed:', error)
    } finally {
      setIsCheckingUpdate(false)
    }
  }

  useEffect(() => {
    const win = getCurrentWindow()

    win
      .show()
      .then(() => {
        return win.setFocus()
      })
      .catch((error) => {
        return console.error('failed to show/focus window:', error)
      })
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
        date: event.payload.date,
        notes: event.payload.notes,
        version: event.payload.version,
      })
    })
      .then((cleanup) => {
        if (mounted) {
          unlisten = cleanup

          return
        }

        cleanup()
      })
      .catch((error) => {
        return console.error('failed to listen for updater events', error)
      })

    return () => {
      mounted = false
      unlisten?.()
    }
  }, [])

  useEffect(() => {
    const url = connectionStateRef.current?.url?.trim()

    if (showQR && state.accessCode && url && canvasRef.current) {
      QRCode.toCanvas(
        canvasRef.current,
        `${url.replace(/\/$/, '')}/?code=${state.accessCode}`,
        {
          color: {
            dark: '#000000',
            light: '#FFFFFF',
          },
          margin: 2,
          width: 160,
        },
        (error) => {
          if (error) {
            console.error(error)
          }
        },
      )
    } else if (canvasRef.current) {
      const context = canvasRef.current.getContext('2d')

      context?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
    }
  }, [state.accessCode, showQR])

  useEffect(() => {
    let mounted = true
    const unlisteners: (() => void)[] = []

    Promise.all([
      listen<ConnectionStateChanged>('connection-state-changed', (event) => {
        dispatch({ payload: stateFromConnectionEvent(event.payload), type: 'SET_CONNECTION' })
      }),
      listen<AccessCodeChanged>('access-code-changed', (event) => {
        dispatch({
          payload: {
            accessCode: event.payload.code || null,
            isGeneratingCode: false,
          },
          type: 'INITIALIZE',
        })
      }),
      listen<AccessCodeGenerating>('access-code-generating', () => {
        dispatch({ payload: true, type: 'SET_GENERATING' })
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
          payload: {
            accessCode: connectionState.code ?? null,
            connection: connectionState.state,
            isGeneratingCode: false,
          },
          type: 'INITIALIZE',
        })
      })
      .catch((error) => {
        console.error('failed to load connection state', error)

        if (mounted) {
          dispatch({
            payload: {
              connection: { ...defaultConduitState, error: 'server_error' },
              isGeneratingCode: false,
            },
            type: 'INITIALIZE',
          })
        }
      })

    return () => {
      mounted = false

      for (const unlisten of unlisteners) {
        unlisten()
      }
    }
  }, [])

  const handleMinimize = () => {
    void getCurrentWindow().minimize()
  }

  const handleClose = () => {
    void getCurrentWindow().close()
  }

  const handleCopyCode = async () => {
    if (!state.accessCode) {
      return
    }

    try {
      await navigator.clipboard.writeText(state.accessCode)
      dispatch({ payload: true, type: 'SET_COPIED' })

      setTimeout(() => {
        return dispatch({ payload: false, type: 'SET_COPIED' })
      }, 2000)
    } catch (error) {
      console.error('failed to copy code:', error)
    }
  }

  const hasRelayError = state.connection.error === 'relay_unreachable' || state.connection.error === 'registration_failed'
  const hasLcuError = state.connection.error === 'lcu_unavailable'

  return (
    <AmbientBackground className='conduit-shell'>
      <div data-tauri-drag-region className='titlebar'>
        <div className='titlebar-title'>{t('app.name')}</div>

        <div className='titlebar-controls'>
          <button
            className='titlebar-button'
            onClick={() => {
              return dispatch({ payload: !state.showSettings, type: 'SET_SHOW_SETTINGS' })
            }}
            title={t('settings.title')}
            type='button'
          >
            <Icon name='settings' size={12} />
          </button>

          <button className='titlebar-button' onClick={handleMinimize} title='Minimize' type='button'>
            <Icon name='minus' size={12} />
          </button>

          <button className='titlebar-button close' onClick={handleClose} title='Close' type='button'>
            <Icon name='x' size={12} />
          </button>
        </div>
      </div>

      <div className='content'>
        <div style={{ alignItems: 'center', display: 'flex', flexDirection: 'column', flexShrink: 0, gap: '16px' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'center' }}>
            <PillStatus label={t('status.relay')} status={state.connection.relay} hasError={hasRelayError} t={t} />

            <PillStatus label={t('status.lcu')} status={state.connection.lcu} hasError={hasLcuError} t={t} />
          </div>

          {state.connection.error && <ErrorBanner error={state.connection.error} t={t} />}
        </div>

        <div
          style={{ alignItems: 'center', display: 'flex', flexDirection: 'column', flexShrink: 0, gap: '24px', width: '100%' }}
        >
          {state.isGeneratingCode ? (
            <GeneratingState label={t('status.generating')} />
          ) : (
            <>
              {showQR ? (
                <div className='qr-container'>
                  <canvas ref={canvasRef} className='qr-canvas' width={160} height={160} />
                </div>
              ) : (
                <div className='access-code'>{(state.accessCode ?? '------').match(/./g)?.join(' ')}</div>
              )}

              <div className='access-code-actions'>
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

                <Button
                  variant='secondary'
                  onClick={() => {
                    return setShowQR(!showQR)
                  }}
                  className='qr-toggle-button'
                >
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
          onClose={() => {
            return dispatch({ payload: false, type: 'SET_SHOW_SETTINGS' })
          }}
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
