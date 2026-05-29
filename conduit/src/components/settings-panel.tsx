import { useCallback, useEffect, useState } from 'react'

import { Button, Card, Icon } from '@shoma/design-system'
import { getTauriVersion, getVersion } from '@tauri-apps/api/app'
import { invoke } from '@tauri-apps/api/core'
import { disable, enable, isEnabled } from '@tauri-apps/plugin-autostart'
import { open } from '@tauri-apps/plugin-shell'

import type { DeviceEntry } from '../app-types'
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
  const [devices, setDevices] = useState<DeviceEntry[]>([])
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

  const fetchDevices = useCallback(async () => {
    try {
      const result = await invoke<DeviceEntry[]>('list_approved_devices')

      setDevices(result)
    } catch (error) {
      console.error('Failed to fetch approved devices', error)
    }
  }, [])

  const handleRevoke = useCallback(
    async (identity: string) => {
      try {
        await invoke('revoke_device', { identity })
        await fetchDevices()
      } catch (error) {
        console.error('Failed to revoke device', error)
      }
    },
    [fetchDevices],
  )

  useEffect(() => {
    void fetchDevices()
  }, [fetchDevices])

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

  const formatDate = (timestamp: number) => {
    if (timestamp === 0) {
      return t('devices.unknown')
    }

    return new Date(timestamp * 1000).toLocaleDateString(language, {
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  }

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
            <div className="settings-label">{t('settings.devices')}</div>

            {devices.length === 0 ? (
              <div className="settings-value">{t('devices.none')}</div>
            ) : (
              <div className="device-list">
                {devices.map((device) => {
                  return (
                    <div key={device.identity} className="device-item">
                      <div className="device-info">
                        <div className="device-name">
                          {device.device}

                          <span className="device-browser">({device.browser})</span>
                        </div>

                        <div className="device-meta">
                          <span className="device-id" title={device.identity}>
                            {device.identity.slice(0, 8)}...
                          </span>

                          <span className="device-date">{formatDate(device.last_connected)}</span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          return handleRevoke(device.identity)
                        }}
                        className="device-revoke"
                        title={t('devices.revoke')}
                      >
                        <Icon name="x" size={14} />
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
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
