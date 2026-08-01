import { useEffect, useReducer } from 'react'

import { AmbientBackground } from '@shoma/design-system'
import { invoke } from '@tauri-apps/api/core'
import { getCurrentWindow } from '@tauri-apps/api/window'

import { appStyles } from './app-styles'
import { appReducer, initialAppState } from './app-utils'
import { AccessCodeSection } from './components/access-code/access-code-section'
import { DeviceApprovalModal } from './components/overlays/device-approval-modal'
import { SettingsPanel } from './components/overlays/settings-panel'
import { UpdatePrompt } from './components/overlays/update-prompt'
import { ErrorToast } from './components/status/error-toast'
import { PillStatus } from './components/status/pill-status'
import { RetryButton } from './components/status/retry-button'
import { TitleBar } from './components/title-bar'
import { useConnectionEvents } from './hooks/use-connection-events'
import { useDeviceApproval } from './hooks/use-device-approval'
import { useI18n } from './hooks/use-i18n'
import { useUpdater } from './hooks/use-updater'
// eslint-disable-next-line import/no-unassigned-import -- Vite CSS entrypoint side effect.
import './style.css'

export default function App() {
  const [state, dispatch] = useReducer(appReducer, initialAppState)
  const { t, language, setLanguage } = useI18n()
  const { dismissUpdate, handleCheckUpdate, isCheckingUpdate, updateInfo } = useUpdater()
  const { approvalRequest, resolveApproval } = useDeviceApproval()
  const connectionStateRef = useConnectionEvents(dispatch)

  useEffect(() => {
    const showWindow = async () => {
      try {
        const autostart = await invoke<boolean>('check_autostart')

        if (autostart) {
          return
        }

        const win = getCurrentWindow()

        await win.show()
        await win.setFocus()
      } catch (error) {
        console.error('failed to show/focus window:', error)
      }
    }

    void showWindow()
  }, [])

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

  const { shell, content } = appStyles()

  return (
    <AmbientBackground className={shell()}>
      <TitleBar
        onToggleSettings={() => {
          return dispatch({ payload: !state.showSettings, type: 'SET_SHOW_SETTINGS' })
        }}
        t={t}
      />

      <div className={content()}>
        <div style={{ alignItems: 'center', display: 'flex', flexDirection: 'column', flexShrink: 0, gap: '16px' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'center' }}>
            <PillStatus label={t('status.relay')} status={state.connection.relay} hasError={hasRelayError} t={t} />

            <PillStatus label={t('status.lcu')} status={state.connection.lcu} hasError={hasLcuError} t={t} />
          </div>

          {state.connection.error && <ErrorToast key={state.connection.error} error={state.connection.error} t={t} />}

          {(state.connection.error || state.connection.reconnect_attempt > 0) && (
            <RetryButton
              disabled={state.connection.relay === 'connecting' || state.connection.lcu === 'connecting'}
              reconnectAttempt={state.connection.reconnect_attempt}
              t={t}
            />
          )}
        </div>

        <AccessCodeSection
          accessCode={state.accessCode}
          copied={state.copied}
          isGeneratingCode={state.isGeneratingCode}
          url={connectionStateRef.current?.url ?? null}
          webUrl={connectionStateRef.current?.webUrl ?? null}
          t={t}
          onCopyCode={handleCopyCode}
        />
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
          t={t}
          onDismiss={() => {
            return dismissUpdate(updateInfo.version)
          }}
        />
      )}

      {approvalRequest && <DeviceApprovalModal request={approvalRequest} t={t} onResolved={resolveApproval} />}
    </AmbientBackground>
  )
}
