# LCU-Connected Chat — Work Session Notes

## Conventions (from codebase)

- **Valibot patterns**: Use `v.fallback(v.optional(schema), default)` for optional fields. Use `v.pipe(finiteNumber, v.transform(fn))` for branded types. Use `parseOrNull`/`parseObjectOrNull` from `./base`.
- **Parser exports**: Each parser file exports schemas + parse functions. Re-exported from `parsers/index.ts`.
- **Tests**: Use `bun:test` (`describe`, `expect`, `test`). Import with relative path `../../../src/core/lcu/parsers/...`.
- **Lint**: `bunx vp lint --max-warnings=0 <file>`
- **Typecheck**: `bunx tsc --noEmit --project apps/web-next/tsconfig.json`

## LCU Chat API (known)

- `GET /lol-chat/v1/conversations` → list of conversations
- `GET /lol-chat/v1/conversations/{id}/messages` → message history
- `POST /lol-chat/v1/conversations/{id}/messages` → send message (body: `{ body: string }`)
- WebSocket observer on path → receives UPDATE frames with new data

## Files touched so far

- `apps/web-next/src/core/lcu/parsers/chat.ts` — new parsers
- `apps/web-next/src/core/lcu/parsers/index.ts` — added export
- `apps/web-next/tests/unit/lcu-parsers/chat.test.ts` — new tests

## Follow-up

- `apps/web-next/src/core/lcu/lcu-queries.ts` now mirrors the existing static/factory descriptor pattern for chat data: `conversationsDescriptor` is static, and `conversationMessagesDescriptor(conversationId)` builds the path and query key from the conversation id.

## Decisions

- Messages are server state (TanStack Query), not Zustand
- No optimistic UI
- No conversation creation
- 1:1 chat only

## 2026-05-08 Follow-up

- Bun test resolution for `@/` imports worked when the test command ran from `apps/web-next/` instead of the repo root.
- The chat conversation lookup is now extracted as a pure helper that returns `{ id }` so the hook can stay thin while tests stay simple.

## 2026-05-08 Code Quality Review

- Targeted lint on the 11 LCU chat changed files passed with 0 warnings and 0 errors.
- LSP diagnostics on all reviewed files returned no diagnostics.
- Related unit tests passed: 11/11.
- Quality concern found: use-chat-lcu observes conversation messages with an empty conversation id before a conversation is selected.
- Full web-next build is currently blocked outside the reviewed files by missing src/i18n/generated during Vite config load.

- 2026-05-08 manual QA: /connected/create-lobby?debug=1 at 470x980 opens Social as a fixed bottom sheet with rounded top corners and drag handle; Chat empty state shows select-friend copy with disabled input/send. Desktop 1440x900 renders Social in the right sidebar. Current debug/offline state exposes no friends, so friend-selection/chat-header/conversation rendering cannot be completed from this browser state. Screenshots saved under /tmp/opencode/mimic-chat-qa/.

## F1 Plan Compliance Audit - 2026-05-08

- Verdict: APPROVE for implementation compliance. Evidence: chat parsers use Valibot; send mutation uses transport.request with LcuHttpMethod.POST; useChatLCU uses useLcuObserverSync and passes null transport when no conversation; SocialPanel renders from chatLCU.messages with Map-based dedupe and timestamp ascending sort; targeted grep found no optimistic updates, conversation creation, message localStorage, or UI group-chat support.
- Verification: lsp_diagnostics clean on audited files; bunx vp lint clean; app-workspace chat unit tests pass. Root-level direct bun test cannot resolve @ alias for hook tests; web-next build is blocked by missing src/i18n/generated before chat code compiles.

## 2026-05-08 useSendChatMessage test note

- The hook unit test can stay fully isolated by mocking `@tanstack/react-query`, `useSharedLCUTransport`, and `useSocialStore`, then driving the returned `mutateAsync` through a tiny lifecycle shim.
- For chat-message invalidation, the query key is `['lcu', 'chat', 'conversations', conversationId, 'messages']`, so the test does not need to import the descriptor helper.

## 2026-05-08 F1 Plan Compliance Audit Rerun

- Verdict: APPROVE. Reviewed listed chat implementation/test files against .sisyphus/plans/lcu-connected-chat.md F1 criteria.
- Evidence: Valibot parsers in parsers/chat.ts; POST mutation via transport.request in use-send-chat-message.ts; useLcuObserverSync in use-chat-lcu.ts; SocialPanel maps only chatLCU.messages, dedupes by message id, sorts ascending, disables send without existing conversation, and does not add optimistic/local messages.
- Verification: bun test tests/unit/social/use-send-chat-message.test.ts from apps/web-next passed (3 pass, 0 fail); lsp diagnostics clean except allowed await-thenable hints in the test file.

## 2026-05-08 F3 manual QA - LCU-connected chat

- agent-browser QA on http://localhost:5173/connected/create-lobby?debug=1 passed with mocked React Query cache data and forced debug connected state.
- Evidence screenshots saved under /tmp/opencode/mimic-chat-qa/: mobile-social-empty.png, mobile-friends-injected.png, mobile-chat-mockfriend.png, mobile-send-enabled.png, mobile-incoming-message.png, mobile-no-conversation.png, desktop-social-sidebar.png, desktop-social-chat-sidebar.png.
- Verified mobile bottom sheet friend selection, active conversation messages, enabled send button after typing, incoming message cache update, no-conversation disabled state, and desktop complementary sidebar rendering.
