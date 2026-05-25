import { createLcuQueryOptions } from '@/core/lcu/lcu-queries'
import { createLCUTransport } from '@/core/relay/lcu-transport'
import { RelayClient, RelayClientState } from '@/core/relay/relay-client'
import { useRelayStore } from '@/core/state/relay-store'

import type { LcuQueryDescriptor } from '@/core/lcu/lcu-queries'
import type { LcuTransport } from '@/core/relay/lcu-transport'
import type { QueryClient } from '@tanstack/react-query'

function waitForConnectedClient(client: RelayClient): Promise<void> {
  if (client.isConnected) {
    return Promise.resolve()
  }

  return new Promise((resolve, reject) => {
    const unsubscribe = client.onStateChange((state) => {
      if (state === RelayClientState.CONNECTED) {
        unsubscribe()
        resolve()

        return
      }

      if (state === RelayClientState.FAILED_DESKTOP_DENIED || state === RelayClientState.FAILED_NO_DESKTOP) {
        unsubscribe()
        reject(new Error(`Relay client failed to connect: ${state}`))
      }
    })

    client.connect()
  })
}

export async function ensureLcuRouteData(
  queryClient: QueryClient,
  descriptors: readonly LcuQueryDescriptor<unknown>[],
): Promise<void> {
  const { code, status } = useRelayStore.getState()

  if (code.length === 0 || status !== 'connected') {
    return
  }

  const client = new RelayClient({ autoReconnect: false, code })
  let transport: LcuTransport | null = null

  try {
    await waitForConnectedClient(client)
    transport = createLCUTransport(client)

    await Promise.all(
      descriptors.map((descriptor) => {
        return queryClient.ensureQueryData(createLcuQueryOptions(descriptor, transport))
      }),
    )
  } catch {
    // Silently skip prefetch if the desktop app is unreachable.
  } finally {
    transport?.close()
    client.close()
  }
}
