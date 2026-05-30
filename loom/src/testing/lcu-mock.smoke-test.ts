import { LcuPaths, type LcuResult } from '@shoma/protocol-contract'
import { expect, test } from 'vitest'

import { createMockLcuTransport } from './lcu-mock'

test('createMockLcuTransport serves mocked gameflow phase requests', async () => {
  const transport = createMockLcuTransport()

  transport.mockGameflowPhase('ReadyCheck')

  await expect(transport.request(LcuPaths.gameflow.phase)).resolves.toEqual({
    content: 'ReadyCheck',
    status: 200,
  })
})

test('createMockLcuTransport dispatches emitted updates to observers', async () => {
  const transport = createMockLcuTransport()
  const updates: LcuResult[] = []
  const unsubscribe = await transport.observe(LcuPaths.matchmaking.readyCheck, (result) => {
    updates.push(result)
  })

  transport.emitUpdate(LcuPaths.matchmaking.readyCheck, { state: 'InProgress' })

  expect(updates).toEqual([{ content: { state: 'InProgress' }, status: 200 }])

  unsubscribe()
  transport.emitUpdate(LcuPaths.matchmaking.readyCheck, { state: 'Accepted' })

  expect(updates).toEqual([{ content: { state: 'InProgress' }, status: 200 }])
})
