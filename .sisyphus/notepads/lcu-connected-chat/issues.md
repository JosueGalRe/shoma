## 2026-05-08 F2 code quality review

- F2 guard with null transport prevents empty-path observer subscription when no conversation is selected, but `conversationMessagesDescriptor(conversationId ?? "")` still creates a fresh `queryKey` array each render; because `useLcuObserverSync` depends on `queryKey`, selected conversations still resubscribe on render unless the descriptor/query key is memoized or dependencies are made stable.

## 2026-05-08 F2 code quality review rerun

- Verdict: REJECT for the required quality gate because `bunx tsc --noEmit --project apps/web-next/tsconfig.json` fails before source checking: `apps/web-next/tsconfig.json(6,27): error TS5103: Invalid value for '--ignoreDeprecations'` with `bunx tsc` resolving TypeScript 5.9.3.
- Positive evidence: production changed-file lint passed with 0 warnings/errors; LSP diagnostics were clean for production files; targeted scans found no `any` types and no `console.*` calls in reviewed production paths; F2 memoized descriptor/null-transport guard is present in `use-chat-lcu.ts`.

## 2026-05-08 F2 code quality review follow-up

- Verdict: APPROVE when excluding the pre-existing `bunx tsc --project`/TypeScript 5.9 `ignoreDeprecations: "6.0"` incompatibility from the chat-change quality gate.
- Verification: `bun run typecheck` from `apps/web-next/` ran `tsc -b` and completed cleanly; production changed-file lint passed with 0 warnings/errors; LSP diagnostics were clean on all production changed files.
- Code review basis: F2 memoization and null-transport observer guard are present in `use-chat-lcu.ts`; no chat-change code-quality issue was found that justifies rejection.

## 2026-05-08 conversation lookup robustness

- LCU chat conversations can expose participants as objects or raw string IDs, and their `type` values are not reliable enough to hard-filter direct messages. The robust fix keeps `participantPuuids`, adds parsed `participantNames`, and uses `chat` only as a preference across ID/name fallback matches.

## 2026-05-08 LCU transport body serialization

- Root cause confirmed in `apps/web-next/src/core/rift/lcu-transport.ts`: object request bodies were placed into the mobile frame before string normalization, so Conduit received a JSON object in slot 4 instead of the JSON string its C# cast expects.
- Fix normalizes `body` before frame serialization: `undefined` remains unset, strings pass through unchanged, and object payloads become JSON strings such as `{"queueId":430}`.
- Chat send body remains `{ body }`: existing local notes record `POST /lol-chat/v1/conversations/{id}/messages` as accepting `{ body: string }`, while generated Hasagi types also show a broader `LolChatConversationMessageResource` with `type`; avoiding an added `type` keeps current hook expectations stable while the transport fix unblocks delivery.
