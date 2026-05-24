import { expect, test } from 'vitest'

import { LcuPaths } from '@shoma/protocol-contract';
import type { LcuResult } from '@shoma/protocol-contract';

import { createMockLcuTransport } from './lcu-mock'

test('createMockLcuTransport serves mocked gameflow phase requests', async () => {
  const transport = createMockLcuTransport()

  transport.mockGameflowPhase('ReadyCheck')

  await expect(transport.request(LcuPaths.gameflow.phase)).resolves.toEqual({
    status: 200,
    content: 'ReadyCheck',
  })
})

test('createMockLcuTransport dispatches emitted updates to observers', async () => {
  const transport = createMockLcuTransport()
  const updates: LcuResult[] = []
  const unsubscribe = await transport.observe(LcuPaths.matchmaking.readyCheck, (result) => {
    updates.push(result)
  })

  transport.emitUpdate(LcuPaths.matchmaking.readyCheck, { state: 'InProgress' })

  expect(updates).toEqual([{ status: 200, content: { state: 'InProgress' } }])

  unsubscribe()
  transport.emitUpdate(LcuPaths.matchmaking.readyCheck, { state: 'Accepted' })

  expect(updates).toEqual([{ status: 200, content: { state: 'InProgress' } }])
})
