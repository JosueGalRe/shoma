import type { QueryClient } from '@tanstack/react-query'

import { createLcuQueryOptions, type LcuQueryDescriptor } from '@/core/lcu/lcu-queries'
import { createLCUTransport, type LcuTransport } from '@/core/rift/lcu-transport'
import { RiftClient, RiftClientState } from '@/core/rift/rift-client'
import { useRiftStore } from '@/core/state/rift-store'

function waitForConnectedClient(client: RiftClient): Promise<void> {
  if (client.isConnected) {
    return Promise.resolve()
  }

  return new Promise((resolve, reject) => {
    const unsubscribe = client.onStateChange((state) => {
      if (state === RiftClientState.CONNECTED) {
        unsubscribe()
        resolve()
        return
      }

      if (state === RiftClientState.FAILED_DESKTOP_DENY || state === RiftClientState.FAILED_NO_DESKTOP) {
        unsubscribe()
        reject(new Error(`Rift client failed to connect: ${state}`))
      }
    })

    client.connect()
  })
}

export async function ensureLcuRouteData(
  queryClient: QueryClient,
  descriptors: readonly LcuQueryDescriptor<unknown>[],
): Promise<void> {
  const { code } = useRiftStore.getState()

  if (code.length === 0) {
    return
  }

  const client = new RiftClient({ code, autoReconnect: false })
  let transport: LcuTransport | null = null

  try {
    await waitForConnectedClient(client)
    transport = createLCUTransport(client)

    await Promise.all(
      descriptors.map((descriptor) => queryClient.ensureQueryData(createLcuQueryOptions(descriptor, transport))),
    )
  } finally {
    transport?.close()
    client.close()
  }
}
