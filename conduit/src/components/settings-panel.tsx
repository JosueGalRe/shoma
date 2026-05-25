import { useEffect, useState } from 'react'

import { Button, Card, Icon } from '@shoma/design-system'
import { getTauriVersion, getVersion } from '@tauri-apps/api/app'
import { disable, enable, isEnabled } from '@tauri-apps/plugin-autostart'
import { open } from '@tauri-apps/plugin-shell'

import type { TranslationKey } from '../app-utils'

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
  const versionLabel = `App: ${appVersion || '...'} | Tauri: ${tauriVersion || '...'}`

  useEffect(() => {
    const fetchVersions = async () => {
      try {
        const appVer = await getVersion()
        const tauriVer = await getTauriVersion()

        setAppVersion(appVer)
        setTauriVersion(tauriVer)
      } catch (error) {
        console.error('Failed to fetch versions', error)
      }
    }

    void fetchVersions()
  }, [])

  useEffect(() => {
    const fetchAutostartStatus = async () => {
      try {
        const enabled = await isEnabled()

        setLaunchAtStartup(enabled)
      } catch (error) {
        console.error('Failed to fetch autostart status', error)
      }
    }

    void fetchAutostartStatus()
  }, [])

  const handleToggleAutostart = async (checked: boolean) => {
    try {
      await (checked ? enable() : disable())

      setLaunchAtStartup(checked)
    } catch (error) {
      console.error('Failed to toggle autostart', error)
    }
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    globalThis.addEventListener('keydown', handleKeyDown)

    return () => {
      return globalThis.removeEventListener('keydown', handleKeyDown)
    }
  }, [onClose])

  return (
    <div className="settings-overlay">
      <div className="settings-header">
        <div className="settings-title">
          <Icon name="settings" size="sm" tone="primary" />

          {t('settings.title')}
        </div>

        <Button className="settings-back-button" onClick={onClose} variant="secondary" size="sm">
          {t('settings.back')}
        </Button>
      </div>

      <div className="settings-content">
        <Card className="settings-card">
          <div className="settings-item">
            <label className="settings-label">
              <input
                aria-label={t('settings.launchAtStartup')}
                type="checkbox"
                checked={launchAtStartup}
                onChange={(e) => {
                  return handleToggleAutostart(e.target.checked)
                }}
                className="settings-checkbox"
              />

              {t('settings.launchAtStartup')}
            </label>
          </div>

          <div className="settings-item">
            <div className="settings-label">{t('settings.language')}</div>

            <select
              aria-label={t('settings.language')}
              value={language}
              onChange={(e) => {
                return setLanguage(e.target.value)
              }}
              className="settings-select"
            >
              <option value="en">{t('lang.en')}</option>

              <option value="es">{t('lang.es')}</option>
            </select>
          </div>
        </Card>

        <Card className="settings-card">
          <div className="settings-item">
            <div className="settings-label">{t('settings.version')}</div>

            <div className="settings-value" style={{ alignItems: 'center', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              <span>{versionLabel}</span>

              <button
                type="button"
                onClick={() => {
                  return open('https://github.com/JosueGalRe/shoma')
                }}
                className="settings-link"
              >
                GitHub
              </button>
            </div>

            <Button variant="secondary" onClick={onCheckUpdate} disabled={isCheckingUpdate} className="mt-2 text-xs">
              {isCheckingUpdate ? t('settings.checkingUpdate') : t('settings.checkUpdate')}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  )
}
