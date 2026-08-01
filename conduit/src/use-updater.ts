import { useEffect, useState } from 'react'

import { listen } from '@tauri-apps/api/event'
import { check } from '@tauri-apps/plugin-updater'

import type { UpdateInfo } from './app-types'

export function useUpdater() {
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

  const dismissUpdate = (version: string) => {
    localStorage.setItem('conduit-dismissed-version', version)
    setUpdateInfo(null)
  }

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

  return { dismissUpdate, handleCheckUpdate, isCheckingUpdate, updateInfo }
}
