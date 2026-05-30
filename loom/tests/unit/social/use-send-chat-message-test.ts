import React, { act } from 'react'

import { LcuHttpMethod, LcuPaths } from '@shoma/protocol-contract'
import { createRoot } from 'react-dom/client'
import { afterEach, describe, expect, test, vi } from 'vitest'

interface SendChatMessageVariables {
  body: string
  conversationId: string
}

interface SendChatMessageResult {
  status: number
}

interface MutationOptions {
  mutationFn: (variables: SendChatMessageVariables) => Promise<SendChatMessageResult>
  onError?: (error: unknown, variables: SendChatMessageVariables, context: undefined) => void
  onSuccess?: (data: SendChatMessageResult, variables: SendChatMessageVariables, context: undefined) => Promise<void> | void
}

interface LcuTransport {
  request: (path: string, method: string, body: { body: string }) => Promise<SendChatMessageResult>
}

let invalidateQueriesMock = vi.fn(async (_options: { queryKey: readonly unknown[] }) => {return undefined})
let requestMock = vi.fn(async (): Promise<SendChatMessageResult> => {return { status: 200 }})
let setErrorMock = vi.fn((_: string | null) => {return undefined})
let transport: LcuTransport | null = { request: requestMock }
let container: HTMLDivElement | null = null
let root: ReturnType<typeof createRoot> | null = null

const socialStoreState = {
  setError: (error: string | null) => {return setErrorMock(error)},
}

const useMutationMock = vi.fn((options: MutationOptions) => {return {
  mutateAsync: async (variables: SendChatMessageVariables) => {
    try {
      const result = await options.mutationFn(variables)

      await options.onSuccess?.(result, variables, undefined)

      return result
    } catch (error) {
      options.onError?.(error, variables, undefined)
      throw error
    }
  },
}})

const queryOptionsMock = vi.fn((options: unknown) => {return options})
const useQueryMock = vi.fn(() => {return {
  data: undefined,
}})

const useQueryClientMock = vi.fn(() => {return {
  invalidateQueries: invalidateQueriesMock,
}})

const useSharedLCUTransportMock = vi.fn(() => {return transport})
const useSocialStoreMock = vi.fn(<T>(selector: (state: typeof socialStoreState) => T): T => {return selector(socialStoreState)})

function renderHookResult() {
  let result: ReturnType<typeof useSendChatMessage> | undefined

  function TestComponent() {
    result = useSendChatMessage()

    return null
  }

  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)

  act(() => {
    root?.render(React.createElement(TestComponent))
  })

  if (!result) {
    throw new Error('Hook did not render')
  }

  return result
}

function cleanupHarness() {
  act(() => {
    root?.unmount()
  })

  root = null
  container?.remove()
  container = null
}

vi.mock('@tanstack/react-query', () => {return {
  queryOptions: queryOptionsMock,
  useMutation: useMutationMock,
  useQuery: useQueryMock,
  useQueryClient: useQueryClientMock,
}})

vi.mock('../../../src/core/relay/use-relay-state', () => {return {
  useSharedLCUTransport: useSharedLCUTransportMock,
}})

vi.mock('../../../src/features/social/social-store', () => {return {
  useSocialStore: useSocialStoreMock,
}})

const { useSendChatMessage } = await import('../../../src/features/social/hooks/use-send-chat-message')

function resetHarness() {
  invalidateQueriesMock = vi.fn(async (_options: { queryKey: readonly unknown[] }) => {return undefined})
  requestMock = vi.fn(async (): Promise<SendChatMessageResult> => {return { status: 200 }})
  setErrorMock = vi.fn((_: string | null) => {return undefined})
  transport = { request: requestMock }
}

describe('useSendChatMessage', () => {
  afterEach(() => {
    cleanupHarness()
  })

  test('sends the message and refreshes the conversation on success', async () => {
    resetHarness()

    const mutation = renderHookResult()
    const variables = { body: 'hello world', conversationId: 'conv-1' }

    await expect(mutation.mutateAsync(variables)).resolves.toEqual({ status: 200 })

    expect(requestMock).toHaveBeenCalledWith(LcuPaths.social.conversationMessages('conv-1'), LcuHttpMethod.POST, {
      body: 'hello world',
      type: 'chat',
    })

    expect(setErrorMock).toHaveBeenCalledWith(null)

    expect(invalidateQueriesMock).toHaveBeenCalledWith({
      queryKey: ['lcu', 'chat', 'conversations', 'conv-1', 'messages'],
    })
  })

  test('surfaces a non-2xx transport response as an error', async () => {
    resetHarness()
    requestMock = vi.fn(async (): Promise<SendChatMessageResult> => {return { status: 500 }})
    transport = { request: requestMock }

    const mutation = renderHookResult()

    await expect(mutation.mutateAsync({ body: 'oops', conversationId: 'conv-2' })).rejects.toThrow('LCU send failed (500)')

    expect(setErrorMock).toHaveBeenCalledWith('Unable to send message: LCU send failed (500)')
  })

  test('fails fast when no transport is available', async () => {
    resetHarness()
    transport = null

    const mutation = renderHookResult()

    await expect(mutation.mutateAsync({ body: 'missing transport', conversationId: 'conv-3' })).rejects.toThrow('No transport')

    expect(setErrorMock).toHaveBeenCalledWith('Unable to send message: No transport')
  })
})
