import { describe, expect, it } from 'bun:test'

import { MobileOpcode } from '@mimic/protocol-contract'

import { RiftLcuTransport } from '../../src/core/rift/rift-lcu-transport'

describe('RiftLcuTransport', () => {
  it('resolves request promises by response id even when responses arrive out of order', async () => {
    const sentFrames: unknown[][] = []

    const transport = new RiftLcuTransport({
      async send(payload) {
        sentFrames.push(JSON.parse(payload) as unknown[])
      },
      isConnected() {
        return true
      },
      onPeer() {
        // no-op
      },
      onQueuePathUpdate() {
        // no-op
      },
      onMapPathUpdate() {
        // no-op
      },
      onObserverError() {
        // no-op
      },
    })

    const firstPending = transport.request('/first')
    const secondPending = transport.request('/second')

    const firstId = sentFrames[0][1] as number
    const secondId = sentFrames[1][1] as number

    transport.handlePayload(JSON.stringify([MobileOpcode.RESPONSE, secondId, 200, { endpoint: 'second' }]))
    transport.handlePayload(JSON.stringify([MobileOpcode.RESPONSE, firstId, 200, { endpoint: 'first' }]))

    await expect(secondPending).resolves.toEqual({ status: 200, content: { endpoint: 'second' } })
    await expect(firstPending).resolves.toEqual({ status: 200, content: { endpoint: 'first' } })
  })

  it('does not send unsubscribe frames when unobserving while disconnected', async () => {
    const sentFrames: unknown[][] = []
    let connected = true

    const transport = new RiftLcuTransport({
      async send(payload) {
        sentFrames.push(JSON.parse(payload) as unknown[])
      },
      isConnected() {
        return connected
      },
      onPeer() {
        // no-op
      },
      onQueuePathUpdate() {
        // no-op
      },
      onMapPathUpdate() {
        // no-op
      },
      onObserverError() {
        // no-op
      },
    })

    const observePromise = transport.observe('/lol-lobby/v2/lobby', () => {
      // no-op
    })

    await Bun.sleep(0)

    const requestFrame = sentFrames.find((frame) => frame[0] === MobileOpcode.REQUEST)
    if (!requestFrame) {
      throw new Error('Expected observe to send request frame.')
    }

    const requestId = requestFrame[1] as number
    transport.handlePayload(JSON.stringify([MobileOpcode.RESPONSE, requestId, 200, {}]))
    await observePromise

    connected = false
    await transport.unobserve('/lol-lobby/v2/lobby')

    const unsubscribeFrames = sentFrames.filter((frame) => frame[0] === MobileOpcode.UNSUBSCRIBE)
    expect(unsubscribeFrames.length).toBe(0)
  })
})
