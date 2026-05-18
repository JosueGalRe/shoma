# LCU-Connected Chat

## TL;DR

> **Summary**: Replace the local-only chat in Mimic's SocialPanel with real LCU-backed messaging: load conversation history from the League Client, send messages via POST, and receive incoming messages through websocket observers in real-time.
> **Deliverables**: Valibot parsers, TanStack Query descriptors, send-message mutation, real-time observer hook, updated SocialPanel, integration tests
> **Effort**: Medium
> **Parallel**: YES — 3 waves
> **Critical Path**: T1 (parsers) → T2 (descriptors) → T3 (mutation) → T4 (observer hook) → T5 (SocialPanel integration)

## Context

### Original Request

User reported that chat messages in Mimic's SocialPanel do not actually send/receive — they are stored only in a local Zustand store. The user wants real LCU-connected chat with:

1. Send messages that reach the League Client
2. Receive messages from the League Client in real-time
3. Load message history when selecting a friend

### Interview Summary

- **Scope**: 1:1 friend chat only. Group chats, clubs, champ select chat excluded.
- **No conversation creation**: If a friend has no conversation, show "No conversation available" and disable send.
- **No optimistic sending**: Wait for server confirmation before showing message.
- **No local persistence**: Messages live in TanStack Query cache only.
- **No offline queue**: If disconnected, show error state.

### Metis Review (gaps addressed)

- **Assumption validated**: Messages will be server state in TanStack Query, not Zustand.
- **Guardrail**: Only existing LCU conversations; no conversation creation.
- **Guardrail**: Deduplicate by stable LCU message ID.
- **Guardrail**: Sort deterministically by timestamp.
- **Edge case**: Friend has no matching conversation → disable input, show "No conversation".
- **Edge case**: Observer delivers duplicate → dedupe by message ID.
- **Edge case**: Self-sent message arrives via observer after POST → dedupe.
- **Missing AC added**: Unit tests for parser, mapping, deduplication.

## Work Objectives

### Core Objective

Wire the existing SocialPanel chat tab to real LCU chat endpoints so that selecting a friend loads their conversation history, typing and sending delivers to the League Client, and incoming messages appear in real-time without page refresh.

### Deliverables

1. `parseLcuConversations` and `parseLcuConversationMessages` parsers (Valibot)
2. `conversationsDescriptor` and `conversationMessagesDescriptor` query descriptors
3. `useSendChatMessage` mutation hook
4. `useChatLCU` hook integrating queries + observer sync + conversation lookup
5. Updated `SocialPanel` rendering server-backed messages
6. Updated `social-store` (extend types, remove local-only messages)
7. Tests for parsers, mapping, deduplication

### Definition of Done (verifiable conditions with commands)

- `bun run lint` passes on all changed files
- `bun run test` passes on all new tests
- `bun run build` succeeds for `apps/web-next`
- Agent QA: mobile social overlay shows message history, send button POSTs to LCU, incoming message appears within 2s

### Must Have

- Parse LCU conversation list
- Parse LCU message list
- Query and load conversation history on friend select
- Send message via POST to `/lol-chat/v1/conversations/{id}/messages`
- Real-time updates via observer on `/lol-chat/v1/conversations/{id}/messages`
- Deduplicate by LCU message ID
- Sort by timestamp ascending
- Disable send when no conversation or blank message
- Show error on failed send
- Show "no conversation" state when applicable

### Must NOT Have (guardrails, AI slop patterns, scope boundaries)

- Group chat support
- Creating new conversations
- Read receipts / unread badges
- Offline message queue / retry orchestration
- LocalStorage persistence of messages
- Optimistic UI (message shown before server confirms)
- Emoji picker, markdown, attachments, rich text
- Message editing or deletion
- Voice chat
- System messages
- Re-architecting the entire social store

## Verification Strategy

> ZERO HUMAN INTERVENTION — all verification is agent-executed.

- **Test decision**: Tests-after (existing test infra exists but feature is new)
- **Framework**: Bun native test runner
- **QA policy**: Every task has agent-executed scenarios
- **Evidence**: `.sisyphus/evidence/task-{N}-{slug}.{ext}`

## Execution Strategy

### Parallel Execution Waves

> Target: 5-8 tasks per wave. <3 per wave (except final) = under-splitting.

**Wave 1**: Foundation (data layer) — parsers, descriptors, types
**Wave 2**: Logic layer — mutation, observer hook, conversation mapping
**Wave 3**: UI layer — SocialPanel integration, store cleanup, tests
**Wave 4**: Final verification

### Dependency Matrix

| Task               | Blocks     | Blocked By |
| ------------------ | ---------- | ---------- |
| T1 (parsers)       | T2, T3, T4 | —          |
| T2 (descriptors)   | T3, T4     | T1         |
| T3 (mutation)      | T4         | T2         |
| T4 (observer hook) | T5         | T2         |
| T5 (SocialPanel)   | F1-F4      | T3, T4     |
| T6 (store cleanup) | F1-F4      | T5         |
| T7 (tests)         | F1-F4      | T1-T6      |

### Agent Dispatch Summary

| Wave   | Task Count | Categories                                       |
| ------ | ---------- | ------------------------------------------------ |
| Wave 1 | 3          | deep, quick, quick                               |
| Wave 2 | 3          | deep, deep, quick                                |
| Wave 3 | 2          | visual-engineering, quick                        |
| Wave 4 | 4          | oracle, unspecified-high, unspecified-high, deep |

## TODOs

- [x] 1. Add LCU chat parsers (conversations + messages)

  **What to do**: Add two Valibot schemas and parser functions in `apps/web-next/src/core/lcu/parsers/chat.ts` (new file):
  - `LcuConversationSchema`: `{ id: string, type: string, unreadCount?: number, lastMessage?: { body: string }, participants?: Array<{ id: string, name: string }> }`
  - `LcuMessageSchema`: `{ id: string, body: string, fromId: string, fromPuuid: string, timestamp: string | number }`
  - `parseLcuConversations(content: unknown): Array<{ id: string, type: string, participantPuuids: string[] }>`
  - `parseLcuConversationMessages(content: unknown): Array<{ id: string, body: string, fromPuuid: string, timestamp: number }>`
  - Export from `apps/web-next/src/core/lcu/parsers/index.ts`
  - Tests go in `apps/web-next/tests/unit/lcu-parsers/chat.test.ts` (follow existing `lcu-parsers/` pattern)
    **Must NOT do**: Do NOT add `any` types. Do NOT store raw LCU payloads in state. Do NOT log message bodies.

  **Recommended Agent Profile**:
  - Category: `deep` — Reason: needs to understand Valibot patterns and LCU payload shapes
  - Skills: `typescript-advanced-types` — Reason: parser type inference
  - Omitted: `react-patterns` — Reason: no UI work here

  **Parallelization**: Can Parallel: YES | Wave 1 | Blocks: T2, T3, T4 | Blocked By: —

  **References**:
  - Pattern: `apps/web-next/src/core/lcu/parsers/base.ts:finiteNumber` — follow existing parser patterns
  - Pattern: `apps/web-next/src/core/lcu/lcu-queries.ts:parseLcuFriend` — follow friend parser shape
  - Type: `apps/web-next/src/features/social/social-store.ts:ChatMessage` — align output shape
  - External: Valibot API — use `v.object`, `v.optional`, `v.fallback`, `v.pipe`

  **Acceptance Criteria**:
  - [ ] `parseLcuConversations([])` returns `[]`
  - [ ] `parseLcuConversations([{ id: 'conv-1', type: 'chat', participants: [{ id: 'p1', name: 'test#tag' }] }])` returns `[{ id: 'conv-1', type: 'chat', participantPuuids: ['p1'] }]`
  - [ ] `parseLcuConversationMessages([{ id: 'msg-1', body: 'hello', fromPuuid: 'p1', timestamp: 1715000000000 }])` returns array with `body: 'hello'`
  - [ ] Parser silently drops malformed entries (does NOT throw)
  - [ ] `bun test apps/web-next/tests/unit/lcu-parsers/chat.test.ts` passes

  **QA Scenarios**:

  ```
  Scenario: Parse valid LCU conversation list
    Tool: Bash
    Steps: bun test apps/web-next/tests/unit/lcu-parsers/chat.test.ts
    Expected: All tests pass, 0 failures
    Evidence: .sisyphus/evidence/task-1-parse-conversations.txt

  Scenario: Parse empty/malformed payloads
    Tool: Bash
    Steps: bun test apps/web-next/tests/unit/lcu-parsers/chat.test.ts --grep "malformed"
    Expected: Tests pass, malformed entries skipped gracefully
    Evidence: .sisyphus/evidence/task-1-parse-malformed.txt
  ```

  **Commit**: YES | Message: `feat(lcu): add chat conversation and message parsers` | Files: `apps/web-next/src/core/lcu/parsers/chat.ts`, `apps/web-next/src/core/lcu/parsers/index.ts`, `apps/web-next/tests/unit/lcu-parsers/chat.test.ts`

- [x] 2. Add LCU chat query descriptors

  **What to do**: In `apps/web-next/src/core/lcu/lcu-queries.ts`, add:
  - `conversationsDescriptor`: `{ path: LcuPaths.social.conversations, queryKey: lcuQueryKey(LcuPaths.social.conversations), parse: parseLcuConversations }`
  - `conversationMessagesDescriptor(conversationId: string)`: returns descriptor with dynamic path `LcuPaths.social.conversationMessages(conversationId)`, query key includes conversationId, parse: parseLcuConversationMessages
  - Follow existing descriptor pattern (see `friendsDescriptor`, `friendGroupsDescriptor`)
    **Must NOT do**: Do NOT add custom staleTime — use default 5s. Do NOT enable transport guard differently from other descriptors.

  **Recommended Agent Profile**:
  - Category: `quick` — Reason: mechanical addition following existing pattern
  - Skills: `typescript-advanced-types` — Reason: satisfies descriptor type constraints
  - Omitted: `tanstack-query-best-practices` — Reason: simple queryOptions, no advanced patterns

  **Parallelization**: Can Parallel: YES | Wave 1 | Blocks: T3, T4 | Blocked By: T1

  **References**:
  - Pattern: `apps/web-next/src/core/lcu/lcu-queries.ts:283-293` (friendsDescriptor, friendGroupsDescriptor)
  - Type: `apps/web-next/src/core/lcu/lcu-queries.ts:30-37` (LcuQueryDescriptor)
  - Path: `packages/protocol-contract/src/lcu/lcu-paths.ts:86-94` (LcuPaths.social)

  **Acceptance Criteria**:
  - [ ] `conversationsDescriptor.path === '/lol-chat/v1/conversations'`
  - [ ] `conversationMessagesDescriptor('abc').path === '/lol-chat/v1/conversations/abc/messages'`
  - [ ] `conversationMessagesDescriptor('abc').queryKey` includes `'abc'`
  - [ ] `bunx vp lint --max-warnings=0 apps/web-next/src/core/lcu/lcu-queries.ts` passes

  **QA Scenarios**:

  ```
  Scenario: Descriptor paths and keys are correct
    Tool: Bash
    Steps: bunx vp lint --max-warnings=0 apps/web-next/src/core/lcu/lcu-queries.ts && bunx tsc --noEmit --project apps/web-next/tsconfig.json
    Expected: Lint and typecheck pass with zero errors
    Evidence: .sisyphus/evidence/task-2-descriptors.txt
  ```

  **Commit**: YES | Message: `feat(lcu): add chat conversation and message descriptors` | Files: `apps/web-next/src/core/lcu/lcu-queries.ts`

- [x] 3. Add send-message mutation hook

  **What to do**: In `apps/web-next/src/features/social/hooks/use-send-chat-message.ts` (new file), create:

  ```ts
  export function useSendChatMessage() {
    const setError = useSocialStore((state) => state.setError)
    const queryClient = useQueryClient()
    const transport = useSharedLCUTransport()
    return useMutation({
      mutationFn: async ({ conversationId, body }: { conversationId: string; body: string }) => {
        if (!transport) throw new Error('No transport')
        const result = await transport.request(LcuPaths.social.conversationMessages(conversationId), LcuHttpMethod.POST, {
          body,
        })
        if (result.status < 200 || result.status >= 300) {
          throw new Error(`LCU send failed (${result.status})`)
        }
        return result
      },
      onSuccess: async (_, variables) => {
        setError(null)
        await queryClient.invalidateQueries({
          queryKey: [...conversationMessagesDescriptor(variables.conversationId).queryKey],
        })
      },
      onError: (error) => {
        const message = error instanceof Error ? error.message : 'Unable to send message.'
        setError(`Unable to send message: ${message}`)
      },
    })
  }
  ```

  Export from `apps/web-next/src/features/social/hooks/index.ts` (**create this file** — it does not exist).
  **Must NOT do**: Do NOT optimistically update cache. Do NOT retry on failure. Do NOT queue messages when offline.

  **Recommended Agent Profile**:
  - Category: `deep` — Reason: mutation wiring with error handling and invalidation
  - Skills: `tanstack-query-best-practices` — Reason: mutation + invalidation patterns
  - Omitted: `react-patterns` — Reason: no React component changes

  **Parallelization**: Can Parallel: NO (depends on T2) | Wave 2 | Blocks: T5 | Blocked By: T2

  **References**:
  - Pattern: `apps/web-next/src/features/social/hooks/use-invite-friend.ts` — exact same pattern (transport.request, onSuccess invalidate, onError setError)
  - Pattern: `apps/web-next/src/core/lcu/lcu-mutations.ts` — createLcuMutation factory shows standard pattern
  - Type: `packages/protocol-contract/src/lcu/lcu-types.ts:5` — LcuHttpMethod.POST

  **Acceptance Criteria**:
  - [ ] Mutation calls `transport.request` with POST method
  - [ ] On success, invalidates conversation messages query key
  - [ ] On error, sets social store error
  - [ ] Throws on transport absence
  - [ ] `bunx vp lint` passes

  **QA Scenarios**:

  ```
  Scenario: Send message succeeds
    Tool: Playwright
    Steps: Login, open social, select friend with conversation, type "hello", click send
    Expected: POST to /lol-chat/v1/conversations/{id}/messages with body "hello", message appears after success
    Evidence: .sisyphus/evidence/task-3-send-success.png

  Scenario: Send message fails (disconnected)
    Tool: Playwright
    Steps: Disconnect LCU, open social, try send
    Expected: Error banner appears, message does NOT appear in list
    Evidence: .sisyphus/evidence/task-3-send-error.png
  ```

  **Commit**: YES | Message: `feat(social): add send-chat-message mutation` | Files: `apps/web-next/src/features/social/hooks/use-send-chat-message.ts`, `apps/web-next/src/features/social/hooks/index.ts`

- [x] 4. Add chat observer hook (useChatLCU)

  **What to do**: In `apps/web-next/src/features/social/hooks/use-chat-lcu.ts` (new file), create a hook that:
  1. Loads conversations list via `useQuery(conversationsDescriptor)`
  2. Syncs conversations via `useLcuObserverSync(conversationsDescriptor, transport)`
  3. Loads messages for selected conversation via `useQuery(conversationMessagesDescriptor(conversationId))`
  4. Syncs messages via `useLcuObserverSync(conversationMessagesDescriptor(conversationId), transport)`
  5. Provides `getConversationForFriend(friendId: Puuid): { id: string } | undefined` helper
  6. Returns `{ conversations, messages, isLoading, error, getConversationForFriend }`
     **Conversation mapping logic**: Filter conversations where `type === 'chat'` and `participants` includes the friend's puuid.
     **Must NOT do**: Do NOT observe ALL conversations messages at once — only the selected one. Do NOT store messages in Zustand.

  **Recommended Agent Profile**:
  - Category: `deep` — Reason: complex hook with conditional observers and query integration
  - Skills: `tanstack-query-best-practices` — Reason: dependent queries, observer sync
  - Omitted: `zustand` — Reason: no Zustand interaction in this hook

  **Parallelization**: Can Parallel: YES (with T3) | Wave 2 | Blocks: T5 | Blocked By: T2

  **References**:
  - Pattern: `apps/web-next/src/features/social/hooks/use-social-lcu.ts` — shows useQuery + useLcuObserverSync pattern for friends
  - Pattern: `apps/web-next/src/features/lobby/hooks/use-lobby.ts` — multiple observer syncs in one hook
  - Observer: `apps/web-next/src/core/lcu/lcu-observer-sync.ts` — exact effect pattern

  **Acceptance Criteria**:
  - [ ] Conversations query loads on mount
  - [ ] Observer syncs conversations in real-time
  - [ ] Messages query loads when `conversationId` changes
  - [ ] Messages observer syncs only for selected conversation
  - [ ] `getConversationForFriend` returns correct conversation or undefined
  - [ ] Returns empty messages when no conversation selected
  - [ ] `bunx vp lint` passes

  **QA Scenarios**:

  ```
  Scenario: Observer receives new incoming message
    Tool: Playwright + agent-browser network route mock
    Steps: Open social chat, mock LCU UPDATE frame with new message
    Expected: Message appears in chat without manual refresh
    Evidence: .sisyphus/evidence/task-4-observer-realtime.png

  Scenario: Switching friends loads different conversation
    Tool: Playwright
    Steps: Select friend A (messages load), select friend B (different messages load)
    Expected: Chat shows correct history per friend
    Evidence: .sisyphus/evidence/task-4-switch-friends.png
  ```

  **Commit**: YES | Message: `feat(social): add useChatLCU hook with queries and observers` | Files: `apps/web-next/src/features/social/hooks/use-chat-lcu.ts`

- [x] 5. Integrate chat into SocialPanel

  **What to do**: In `apps/web-next/src/features/social/components/SocialPanel.tsx`:
  1. Replace `const messages = useSocialStore((state) => state.messages)` with `const { messages: lcuMessages, getConversationForFriend } = useChatLCU()`
  2. Replace `handleSendMessage` to call `sendMessageMutation.mutate({ conversationId, body: text })` instead of `addMessage()`
  3. Map `lcuMessages` to UI format: determine `isOutgoing` by comparing `message.fromPuuid` to current user's puuid. **Use `useQuery(createLcuQueryOptions(currentSummonerDescriptor, transport))` to get current summoner, then read `summoner.puuid`.** If current summoner query is not yet loaded, default `isOutgoing` to `false` for all messages.
  4. Sort messages by timestamp ascending before rendering
  5. Deduplicate by message ID
  6. Show "No conversation" when `getConversationForFriend(selectedFriendId)` returns undefined
  7. Disable send button when no conversation or blank draft
  8. Keep existing Zustand `messages` as fallback or clear it entirely
     **Must NOT do**: Do NOT break existing friend list rendering. Do NOT break invite button. Do NOT change desktop sidebar behavior.

  **Recommended Agent Profile**:
  - Category: `visual-engineering` — Reason: React component changes with conditional rendering
  - Skills: `react-patterns`, `vercel-react-best-practices` — Reason: component integration, performance
  - Omitted: `typescript-advanced-types` — Reason: types already defined

  **Parallelization**: Can Parallel: NO | Wave 3 | Blocks: T6 | Blocked By: T3, T4

  **References**:
  - Component: `apps/web-next/src/features/social/components/SocialPanel.tsx:307-368` — chat tab rendering
  - Component: `apps/web-next/src/features/social/components/SocialPanel.tsx:117-133` — handleSendMessage
  - Hook: `apps/web-next/src/features/lobby/hooks/use-lobby.ts` — example of multiple data sources
  - Type: `apps/web-next/src/features/social/social-store.ts:17-23` — ChatMessage shape

  **Acceptance Criteria**:
  - [ ] Chat tab renders messages from `useChatLCU` instead of local store
  - [ ] Send button calls mutation instead of local addMessage
  - [ ] Outgoing messages have `isOutgoing: true` when fromPuuid matches current user
  - [ ] Messages sorted oldest → newest
  - [ ] Duplicate messages (same ID) render only once
  - [ ] "No conversation" shown when applicable
  - [ ] Send disabled when no conversation or blank message
  - [ ] Existing friend list, invite, tabs untouched
  - [ ] Desktop sidebar still works
  - [ ] `bunx vp lint` passes

  **QA Scenarios**:

  ```
  Scenario: Full chat flow on mobile
    Tool: Playwright
    Steps: Open social overlay, select friend, see history, type "test", send, see message appear
    Expected: Message history loads, send POSTs, new message appears, sorted correctly
    Evidence: .sisyphus/evidence/task-5-mobile-chat-flow.png

  Scenario: Friend with no conversation
    Tool: Playwright
    Steps: Select friend with no conversation
    Expected: "No conversation available" text, input disabled, send button disabled
    Evidence: .sisyphus/evidence/task-5-no-conversation.png
  ```

  **Commit**: YES | Message: `feat(social): wire SocialPanel chat to LCU` | Files: `apps/web-next/src/features/social/components/SocialPanel.tsx`

- [x] 6. Update social-store types and cleanup

  **What to do**: In `apps/web-next/src/features/social/social-store.ts`:
  1. Extend `ChatMessage` type to include optional `conversationId?: string` and `lcuId?: string`
  2. Keep `messages` array but document it as "fallback / transitional"
  3. Add `clearMessages()` action to empty local messages
  4. Export `useCurrentUserPuuid` helper from a new hook or use existing current summoner query
     **Must NOT do**: Do NOT remove ChatMessage type (used by SocialPanel). Do NOT add localStorage persistence for messages.

  **Recommended Agent Profile**:
  - Category: `quick` — Reason: type additions and cleanup
  - Skills: `zustand` — Reason: store modifications
  - Omitted: `react-patterns` — Reason: no component changes

  **Parallelization**: Can Parallel: YES (with T5) | Wave 3 | Blocks: T7 | Blocked By: T5

  **References**:
  - Store: `apps/web-next/src/features/social/social-store.ts` — existing state and actions
  - Type: `apps/web-next/src/core/types/branded.ts` — Puuid type

  **Acceptance Criteria**:
  - [ ] `ChatMessage` type has `conversationId?` and `lcuId?`
  - [ ] `clearMessages` action empties local message array
  - [ ] `bunx vp lint` passes

  **QA Scenarios**:

  ```
  Scenario: Store types compile
    Tool: Bash
    Steps: bunx tsc --noEmit --project apps/web-next/tsconfig.json
    Expected: Zero type errors in social feature
    Evidence: .sisyphus/evidence/task-6-types.txt
  ```

  **Commit**: YES | Message: `refactor(social): extend ChatMessage type, add clearMessages` | Files: `apps/web-next/src/features/social/social-store.ts`

- [x] 7. Add unit tests for parsers and mapping

  **What to do**: Create test files:
  1. `apps/web-next/tests/unit/lcu-parsers/chat.test.ts` — test parseLcuConversations and parseLcuConversationMessages with valid, empty, malformed payloads
  2. `apps/web-next/tests/unit/social/use-chat-lcu.test.ts` — test getConversationForFriend mapping logic with fixture data
  3. `apps/web-next/tests/unit/social/use-send-chat-message.test.ts` — test mutation error handling
     Follow existing test patterns in `apps/web-next/tests/unit/` (see `lcu-parsers/base.test.ts` and `rift-store.test.ts`)
     **Must NOT do**: Do NOT test actual LCU transport. Mock transport.request.

  **Recommended Agent Profile**:
  - Category: `quick` — Reason: unit tests following patterns
  - Skills: `typescript-advanced-types` — Reason: mock types
  - Omitted: `agent-browser-automation` — Reason: unit tests, not e2e

  **Parallelization**: Can Parallel: NO | Wave 3 | Blocks: F1-F4 | Blocked By: T1-T6

  **References**:
  - Pattern: `apps/web-next/tests/unit/` — existing test files
  - Mock: `apps/web-next/src/core/rift/lcu-transport.ts` — transport interface for mocking

  **Acceptance Criteria**:
  - [ ] Parser tests cover valid, empty, malformed cases
  - [ ] Mapping tests cover found, not-found, multiple participants
  - [ ] Mutation tests cover success, error, no-transport
  - [ ] `bun test apps/web-next/tests/unit/lcu-parsers/chat.test.ts` passes
  - [ ] `bun test apps/web-next/tests/unit/social/use-chat-lcu.test.ts` passes
  - [ ] `bun test apps/web-next/tests/unit/social/use-send-chat-message.test.ts` passes

  **QA Scenarios**:

  ```
  Scenario: All unit tests pass
    Tool: Bash
    Steps: bun test apps/web-next/tests/unit/lcu-parsers/chat.test.ts apps/web-next/tests/unit/social/use-chat-lcu.test.ts apps/web-next/tests/unit/social/use-send-chat-message.test.ts
    Expected: 0 failures
    Evidence: .sisyphus/evidence/task-7-tests.txt
  ```

  **Commit**: YES | Message: `test(social): add chat parser and hook unit tests` | Files: `apps/web-next/tests/unit/lcu-parsers/chat.test.ts`, `apps/web-next/tests/unit/social/use-chat-lcu.test.ts`, `apps/web-next/tests/unit/social/use-send-chat-message.test.ts`

## Final Verification Wave (MANDATORY — after ALL implementation tasks)

> 4 review agents run in PARALLEL. ALL must APPROVE. Present consolidated results to user and get explicit "okay" before completing.
> **Do NOT auto-proceed after verification. Wait for user's explicit approval before marking work complete.**

- [x] F1. Plan Compliance Audit — oracle
      Verify all tasks conform to plan: parsers use Valibot, mutation follows transport.request pattern, observer uses useLcuObserverSync, SocialPanel only renders server-backed messages, no optimistic updates, no group chat, no conversation creation.

- [x] F2. Code Quality Review — unspecified-high
      Review all changed files for lint errors, TypeScript strictness, consistent naming, no `any`, no console.log of message bodies, proper error handling.

- [x] F3. Real Manual QA — unspecified-high (+ playwright if UI)
      Run agent-browser automation:
  1. Open social overlay on mode selection screen
  2. Select friend with conversation → verify history loads
  3. Type message, click send → verify POST to LCU
  4. Mock incoming UPDATE frame → verify message appears
  5. Select friend without conversation → verify disabled state
  6. Verify desktop sidebar unchanged

- [x] F4. Scope Fidelity Check — deep
      Verify no scope creep: no group chat, no read receipts, no optimistic UI, no local persistence, no offline queue, no message editing.

## Commit Strategy

- Each task commits independently after passing lint/tests
- Final wave commits only after all F1-F4 approve
- Rebase squash optional before merge if user prefers single commit

## Success Criteria

- [ ] Messages send to LCU and appear in League Client
- [ ] Incoming messages from League Client appear in Mimic in real-time
- [ ] Message history loads when selecting a friend
- [ ] "No conversation" shown when applicable
- [ ] Desktop sidebar social panel unchanged
- [ ] Mobile social overlay works correctly
- [ ] All lint, typecheck, and tests pass
- [ ] No scope creep (group chat, optimistic UI, offline queue)
