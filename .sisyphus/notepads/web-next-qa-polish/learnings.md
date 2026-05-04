2026-05-02: `parseLobbyDetails` can safely fall back to `state.gameConfig.customLobbyName` for the local member only; bots and other members should keep their existing display-name handling.
2026-05-02: `LobbyState.gameConfig` does not currently declare `customLobbyName`, so the helper needs a narrow local cast/read to satisfy TypeScript without changing shared types.
2026-05-03: Empty `catch` blocks in the connect entry form can be replaced with targeted `console.error` calls without affecting the submit flow; the ARAM panel only needs the store hook used at click time.
2026-05-03: `createLCUClient({ connectOnCreate: false })` avoids the rift hook's startup side effect while preserving lazy connection behavior for actual subscriptions and requests.
2026-05-03: Rendering the ready-check overlay through `createPortal(..., document.body)` keeps fixed-position modal layers out of AppShell transform containment.

## F2 Final Re-run Code Quality Review - 2026-05-03
- APPROVE: production createLCUClient call sites reviewed use connectOnCreate: false; integration-test calls remain intentionally configurable.
- Empty catch scans found no empty catch blocks in apps/web-next/src.
- ready-check-modal.tsx uses createPortal(modalContent, document.body).
- lsp_diagnostics returned no diagnostics for reviewed changed files.

## 2026-05-04 F3 Final Manual QA
- Dev server started cleanly on http://localhost:5175 after 5173/5174 were occupied; root returned HTTP 200.
- Playwright MCP was blocked by missing system Chrome, but repo Playwright CLI worked. Mobile screenshot smoke passed 4/4.
- 320px QA measurements: no console/page errors; champ select scrollWidth=320; ARAM New Cards button clientWidth=236 and scrollWidth=236; ready check portal overlay and section are fixed BODY children covering 320x812.
- Evidence screenshots: /tmp/opencode/final-qa-champ-select-320.png and /tmp/opencode/final-qa-ready-check-320.png.
