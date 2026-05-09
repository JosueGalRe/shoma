
## 2026-05-09 Manual QA - f3-manual-qa issues
- REJECT: Clicking DECLINAR on the ReadyCheck overlay did not dismiss the overlay in the browser, even after retrying with a semantic button locator and waiting 1s. See 04-after-decline.png and 05-decline-still-visible.png.
- Verification note: bun run --filter @mimic/web-next test exited 1 with existing failures in rift-handshake timeout tests, i18n resource parity, and arena-mode provider setup. Build exited 0 and LSP diagnostics over apps/web-next/src reported 0 errors.

## 2026-05-08 - unrelated verification failures
- bun test from apps/web-next fails outside this task: tests/integration/rift-handshake.test.ts times out waiting for socket messages, tests/integration/i18n-resources-parity.test.ts reports missing Spanish lobby keys, and tests/unit/arena-mode.test.ts renders without RiftClientProvider.
- bun run build succeeds after the resolver route-set typing fix.
