import { useEffect, useState } from 'react'

import { listen } from '@tauri-apps/api/event'
import { getCurrentWindow } from '@tauri-apps/api/window'

import type { DeviceApprovalRequest } from './app-types'

export function useDeviceApproval() {
  const [approvalRequest, setApprovalRequest] = useState<DeviceApprovalRequest | null>(null)

  const resolveApproval = () => {
    setApprovalRequest(null)
  }

  useEffect(() => {
    let mounted = true
    let unlisten: (() => void) | undefined

    listen<DeviceApprovalRequest>('device-approval-requested', async (event) => {
      if (!mounted) {
        return
      }

      setApprovalRequest(event.payload)

      try {
        const win = getCurrentWindow()

        await win.show()
        await win.setFocus()
      } catch (error) {
        console.error('failed to bring window to front for device approval:', error)
      }
    })
      .then((cleanup) => {
        if (mounted) {
          unlisten = cleanup

          return
        }

        cleanup()
      })
      .catch((error) => {
        return console.error('failed to listen for device approval events', error)
      })

    return () => {
      mounted = false
      unlisten?.()
    }
  }, [])

  return { approvalRequest, resolveApproval }
}
