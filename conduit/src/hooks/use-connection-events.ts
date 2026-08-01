import { type Dispatch, useEffect, useRef } from 'react'

import { invoke } from '@tauri-apps/api/core'
import { listen } from '@tauri-apps/api/event'

import { defaultConduitState, stateFromConnectionEvent } from '../app-utils'

import type { AccessCodeChanged, AccessCodeGenerating, AppAction, ConnectionState, ConnectionStateChanged } from '../app-types'

export function useConnectionEvents(dispatch: Dispatch<AppAction>) {
  const connectionStateRef = useRef<ConnectionState | null>(null)

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
  }, [dispatch])

  return connectionStateRef
}
