/// <reference types="bun-types" />

import { describe, expect, mock, test } from 'bun:test'
import { LcuHttpMethod, LcuPaths } from '@shoma/protocol-contract'

type SendChatMessageVariables = {
  body: string
  conversationId: string
}

type SendChatMessageResult = {
  status: number
}

type MutationOptions = {
  mutationFn: (variables: SendChatMessageVariables) => Promise<SendChatMessageResult>
  onError?: (error: unknown, variables: SendChatMessageVariables, context: undefined) => void
  onSuccess?: (
    data: SendChatMessageResult,
    variables: SendChatMessageVariables,
    context: undefined,
  ) => Promise<void> | void
}

type LcuTransport = {
  request: (path: string, method: string, body: { body: string }) => Promise<SendChatMessageResult>
}

let invalidateQueriesMock = mock(async (_options: { queryKey: readonly unknown[] }) => undefined)
let requestMock = mock(async (): Promise<SendChatMessageResult> => ({ status: 200 }))
let setErrorMock = mock((_: string | null) => undefined)
let transport: LcuTransport | null = { request: requestMock }

const socialStoreState = {
  setError: (error: string | null) => setErrorMock(error),
}

const useMutationMock = mock((options: MutationOptions) => ({
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
}))

const queryOptionsMock = mock((options: unknown) => options)
const useQueryMock = mock(() => ({
  data: undefined,
}))

const useQueryClientMock = mock(() => ({
  invalidateQueries: invalidateQueriesMock,
}))

const useSharedLCUTransportMock = mock(() => transport)
const useSocialStoreMock = mock(<T>(selector: (state: typeof socialStoreState) => T): T =>
  selector(socialStoreState),
)

mock.module('@tanstack/react-query', () => ({
  queryOptions: queryOptionsMock,
  useMutation: useMutationMock,
  useQuery: useQueryMock,
  useQueryClient: useQueryClientMock,
}))

mock.module('../../../src/core/relay/relay-client-provider', () => ({
  useSharedLCUTransport: useSharedLCUTransportMock,
}))

mock.module('../../../src/features/social/social-store', () => ({
  useSocialStore: useSocialStoreMock,
}))

const { useSendChatMessage } = await import('../../../src/features/social/hooks/use-send-chat-message')

function resetHarness() {
  invalidateQueriesMock = mock(async (_options: { queryKey: readonly unknown[] }) => undefined)
  requestMock = mock(async (): Promise<SendChatMessageResult> => ({ status: 200 }))
  setErrorMock = mock((_: string | null) => undefined)
  transport = { request: requestMock }
}

describe('useSendChatMessage', () => {
  test('sends the message and refreshes the conversation on success', async () => {
    resetHarness()

    const mutation = useSendChatMessage()
    const variables = { conversationId: 'conv-1', body: 'hello world' }

    await expect(mutation.mutateAsync(variables)).resolves.toEqual({ status: 200 })

    expect(requestMock).toHaveBeenCalledWith(
      LcuPaths.social.conversationMessages('conv-1'),
      LcuHttpMethod.POST,
      { body: 'hello world', type: 'chat' },
    )
    expect(setErrorMock).toHaveBeenCalledWith(null)
    expect(invalidateQueriesMock).toHaveBeenCalledWith({
      queryKey: ['lcu', 'chat', 'conversations', 'conv-1', 'messages'],
    })
  })

  test('surfaces a non-2xx transport response as an error', async () => {
    resetHarness()
    requestMock = mock(async (): Promise<SendChatMessageResult> => ({ status: 500 }))
    transport = { request: requestMock }

    const mutation = useSendChatMessage()

    await expect(mutation.mutateAsync({ conversationId: 'conv-2', body: 'oops' })).rejects.toThrow(
      'LCU send failed (500)',
    )

    expect(setErrorMock).toHaveBeenCalledWith('Unable to send message: LCU send failed (500)')
  })

  test('fails fast when no transport is available', async () => {
    resetHarness()
    transport = null

    const mutation = useSendChatMessage()

    await expect(mutation.mutateAsync({ conversationId: 'conv-3', body: 'missing transport' })).rejects.toThrow(
      'No transport',
    )

    expect(setErrorMock).toHaveBeenCalledWith('Unable to send message: No transport')
  })
})
