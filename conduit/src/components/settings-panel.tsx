import { useCallback, useEffect, useState } from 'react'

import { Button, Card, Icon } from '@shoma/design-system'
import { getTauriVersion, getVersion } from '@tauri-apps/api/app'
import { invoke } from '@tauri-apps/api/core'
import { disable, enable, isEnabled } from '@tauri-apps/plugin-autostart'
import { open } from '@tauri-apps/plugin-shell'

import { settingsPanelStyles } from './settings-panel-styles'

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

  const handleRevoke = async (identity: string) => {
    try {
      await invoke('revoke_device', { identity })
      await fetchDevices()
    } catch (error) {
      console.error('Failed to revoke device', error)
    }
  }

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

    // eslint-disable-next-line react-doctor/no-locale-format-in-render -- explicit locale already; Tauri desktop app, no SSR hydration
    return new Date(timestamp * 1000).toLocaleDateString(language, {
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  }

  const {
    overlay,
    header,
    title,
    content,
    card,
    item,
    label: labelClass,
    checkbox,
    select,
    value,
    link,
    deviceList,
    deviceItem,
    deviceInfo,
    deviceName,
    deviceBrowser,
    deviceMeta,
    deviceId,
    deviceDate,
    deviceRevoke,
  } = settingsPanelStyles()

  return (
    <div className={overlay()}>
      <div className={header()}>
        <div className={title()}>
          <Icon name="settings" size="sm" tone="primary" />

          {t('settings.title')}
        </div>

        <Button className="min-h-7 px-3 py-1 text-xs" onClick={onClose} variant="secondary" size="sm">
          {t('settings.back')}
        </Button>
      </div>

      <div className={content()}>
        <Card className={card()}>
          <div className={item()}>
            <label className={labelClass()}>
              <input
                aria-label={t('settings.launchAtStartup')}
                type="checkbox"
                checked={launchAtStartup}
                onChange={(e) => {
                  return handleToggleAutostart(e.target.checked)
                }}
                className={checkbox()}
              />

              {t('settings.launchAtStartup')}
            </label>
          </div>

          <div className={item()}>
            <div className={labelClass()}>{t('settings.language')}</div>

            <select
              aria-label={t('settings.language')}
              value={language}
              onChange={(e) => {
                return setLanguage(e.target.value)
              }}
              className={select()}
            >
              <option value="en">{t('lang.en')}</option>

              <option value="es">{t('lang.es')}</option>
            </select>
          </div>
        </Card>

        <Card className={card()}>
          <div className={item()}>
            <div className={labelClass()}>{t('settings.devices')}</div>

            {devices.length === 0 ? (
              <div className={value()}>{t('devices.none')}</div>
            ) : (
              <div className={deviceList()}>
                {devices.map((device) => {
                  return (
                    <div key={device.identity} className={deviceItem()}>
                      <div className={deviceInfo()}>
                        <div className={deviceName()}>
                          {device.device}

                          <span className={deviceBrowser()}>({device.browser})</span>
                        </div>

                        <div className={deviceMeta()}>
                          <span className={deviceId()} title={device.identity}>
                            {device.identity.slice(0, 8)}...
                          </span>

                          <span className={deviceDate()}>{formatDate(device.last_connected)}</span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          return handleRevoke(device.identity)
                        }}
                        className={deviceRevoke()}
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

        <Card className={card()}>
          <div className={item()}>
            <div className={labelClass()}>{t('settings.version')}</div>

            <div className={value()} style={{ alignItems: 'center', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              <span>{versionLabel}</span>

              <button
                type="button"
                onClick={() => {
                  return open('https://github.com/JosueGalRe/shoma')
                }}
                className={link()}
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
