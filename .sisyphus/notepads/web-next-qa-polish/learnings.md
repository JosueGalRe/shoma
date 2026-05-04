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
## 2026-05-03

- `web-next` path aliases need to stay relative to the app tsconfig when `baseUrl` is removed; otherwise `tsc -b` loses `@/` resolution even if Vite still understands the aliases.
- `vp lint --max-warnings=0 src tests` can surface unrelated pre-existing warnings outside the original target files, so the final pass needs to cover the whole app.
- Lobby route i18n works best when route-local helper components call `useTranslation()` directly for their own labels and option text.
- Mapping lobby role enums to locale keys keeps the UI consistent with the existing data model and avoids hardcoding role labels in the route.
- 2026-05-03: Shared shell text is best translated at the leaf component level (`connection-status`, `spinner`, `LandscapeWarning`) while route shell state labels should map raw store values to locale keys.
- 2026-05-03: `use-connection-flow` should emit translation keys for connection failures so `ConnectionStatus` can translate them in one place; this keeps the hook free of i18n dependencies.
- 2026-05-03: Champ-select spell icons should always derive from the versioned Data Dragon URL pattern; the LCU `iconPath` is not safe for web rendering.
- 2026-05-03: `disconnect()` clears `rift-store.error`, so connection failure keys must be set after disconnecting if the UI needs to render them.
- 2026-05-03: Data Dragon summoner spell URLs should use the canonical `summoner.json` `image.full` filenames (eg. Ignite → `SummonerDot.png`, Cleanse → `SummonerBoost.png`) instead of normalized spell names.
- 2026-05-03: Champ-select and ARAM store errors are easier to localize when the stores emit translation keys directly and the route translates the final key once.
