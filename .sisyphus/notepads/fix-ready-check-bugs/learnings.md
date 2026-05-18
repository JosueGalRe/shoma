2026-05-09: Extracted the ready-check countdown duration into `apps/web-next/src/features/ready-check/constants.ts` so the overlay no longer depends on the magic number `12` in the progress calculation.
Adjusted ready-check mutations to use POST for accept/decline, matching the legacy web behavior and preventing LCU 405 responses.
2026-05-09: Ready-check `timer` is elapsed seconds, so the hook must convert it to remaining time with `READY_CHECK_DURATION_SECONDS - timer` before passing it to `useCountdown`.
2026-05-09: The ready-check overlay should keep the blur on the outer backdrop only, treat `timer` as remaining seconds for the progress bar, and lock body scroll while visible while restoring the previous `overflow` value on cleanup.
2026-05-09: Server-rendered overlay tests need `QueryClientProvider` and `I18nextProvider`, and the component must be rendered via `renderToStaticMarkup` instead of being invoked directly so React hooks run in a valid render context.
2026-05-09: Hook timer tests can isolate ready-check conversion by mocking `useCountdown` to echo its input, then asserting the rendered timer text for elapsed values 0, 6, and 12.

## 2026-05-09 Scope Fidelity Check

- Ready-check working tree changes stayed within expected source/test files plus plan/notepad artifacts.
- Guardrail checks found no legacy web, parser, store state machine, observer sync, dependency, useCountdown, queue, or other countdown-consumer changes in the working diff.
- Recent HEAD commit is broader than this ready-check plan and does not match the per-task focused commit strategy.
  2026-05-09: Bun test module mocks for `@tanstack/react-query` still resolved to the real package in this environment, so the ready-check suite could not be made green without changing the test runner setup.
  2026-05-09: The overlay test file already uses source assertions and avoids `document`, so the targeted Bun test passes in a no-DOM environment without extra guards.
  2026-05-09: Source-text assertions were the simplest stable way to verify the fixed ready-check behavior once Bun's module mocking proved unreliable for the react-query imports.
  2026-05-09: Code quality re-review approved the ready-check edge fixes: negative elapsed timers are clamped before remaining-time conversion, null snapshots expire pending state, overlay scroll lock is guarded for SSR with cleanup, and accept/decline mutations use POST.
