# F1 Plan Compliance Audit — web-next UI redesign

Date: 2026-05-02

## Verdict: REJECT

The implementation is partially compliant: layout, safe-area utilities, landscape warning, champ-select filtering/search/tabs, lazy image loading markers, preconnect, and the required Bun test/build commands are present and passing. However, the plan cannot be approved because several Definition of Done / Must Have items are missing or only documented as unavailable: Playwright is not configured, no Playwright screenshot evidence exists, Lighthouse score was not produced, and the champ-select champions grid uses Data Dragon champion icons rather than splash art.

## Required command verification

- `bun run --filter @mimic/web-next test`: PASS
  - Output: `30 pass`, `0 fail`, `79 expect() calls`, `Ran 30 tests across 9 files`, exit code 0.
- `bun run --filter @mimic/web-next build`: PASS
  - Output: Vite build completed, `✓ built in 3.14s`, PWA assets generated, exit code 0.
  - Note: build emitted non-fatal warning: `/assets/map-bg.jpg referenced in /assets/map-bg.jpg didn't resolve at build time`.

## Definition of Done compliance

1. Champ Select renderiza grid con lazy loading, filtros funcionan, búsqueda filtra — PARTIAL PASS
   - Evidence: `apps/web-next/src/routes/connected/champ-select/-components/ChampionsTab.tsx` renders a responsive grid at lines 91-134, role chips at lines 73-88, search input/filtering at lines 37-53 and 66-70.
   - Evidence: lazy loading markers exist in `ChampionsTab.tsx`: `IntersectionObserver` at lines 202-219, `data-src` at line 235, `loading="lazy"` at line 237, `decoding="async"` at line 238.
   - Issue: this was verified statically, not by Playwright interaction evidence. Also `formatChampionLabel` is imported but unused in the inspected file, which may be caught by stricter linting if enabled.
2. Layout soporta safe areas y muestra warning en landscape — PASS
   - Evidence: `apps/web-next/src/components/layout/AppShell.tsx` wraps content with `SafeArea` and includes `LandscapeWarning` at lines 14-15.
   - Evidence: `apps/web-next/src/components/layout/LandscapeWarning.tsx` uses `window.matchMedia('(orientation: landscape)')` and `window.innerWidth < 768` at lines 7-10.
   - Evidence: `apps/web-next/src/styles.css` defines `.safe-area-padding` with all four `env(safe-area-inset-*)` values at lines 297-301.
3. `bun run --filter @mimic/web-next test` pasa — PASS
   - Evidence: command run during this audit exited 0 with 30 passing tests.
4. `bun run --filter @mimic/web-next build` compila — PASS
   - Evidence: command run during this audit exited 0.
5. Lighthouse mobile score ≥ 80 — REJECT / NOT VERIFIED
   - Evidence: `.sisyphus/evidence/web-next-redesign/t7-audit.md` documents that Lighthouse could not run because no Chrome installation is available; no `t7-lighthouse.json` was generated.
   - Plan requires a Lighthouse mobile score ≥ 80. The fallback is documented, but it does not satisfy the numeric DoD.
6. Playwright screenshots de todas las pantallas sin regresiones — REJECT
   - Evidence: no `playwright.config.*` exists anywhere in the repository; `apps/web-next/playwright.config.ts` is absent.
   - Evidence: `.sisyphus/evidence/web-next-redesign/` contains only `t1-audit.md` and `t7-audit.md` before this report; no screenshot artifacts or Playwright evidence files were present.

## Must Have compliance

1. Champ Select: grid con splash art Data Dragon, filtros por rol, búsqueda, lazy loading, tabs — REJECT
   - Pass evidence: `ChampSelectTabs.tsx` defines Champions/Spells/Runes/Skins tabs at lines 13-18.
   - Pass evidence: `ChampionsTab.tsx` implements role chips, search, grid, and lazy image loading as listed above.
   - Failure evidence: grep found no `buildChampionSplashUrl` or `splash` usage under `apps/web-next/src/routes/connected/champ-select`; `ChampionsTab.tsx` imports and calls `buildChampionIconUrl` at lines 9 and 103. This does not meet the plan’s splash-art grid requirement.
2. Layout: AppShell reutilizable, safe-area-inset, landscape warning — PASS
   - Evidence: layout components exist: `AppShell.tsx`, `LandscapeWarning.tsx`, `SafeArea.tsx`.
   - Evidence: `AppShell` is imported into `apps/web-next/src/routes/index/route.tsx` and `apps/web-next/src/routes/connected/route.tsx`.
3. Connect: input mejorado, estados animados — PASS
   - Evidence: `connect-entry-form.tsx` uses a large `otp-input` styled input at lines 26-32, `animate-connection-wave` for pending state, and `animate-shake` for errors.
   - Evidence: `connect-screen.tsx` renders pending copy for connecting/handshaking at lines 60-66.
4. Lobby: QueueCard con fondo de mapa, ReadyCheckCard con urgency visual, MembersCard con avatars — PASS
   - Evidence: `QueueCard.tsx` uses map background image overlay at lines 22-28 and prominent queue/timer UI at lines 37-43.
   - Evidence: `ReadyCheckCard.tsx` switches to `animate-countdown-pulse` when timer `< 5` at line 27.
   - Evidence: `LobbyMembersCard.tsx` renders circular Data Dragon/fallback avatars and local-member gold ring at lines 153-164.
5. Invites: avatars circulares, share sheet básico — PASS
   - Evidence: `ConnectedReceivedInvitesCard` renders circular invite avatars/fallback at lines 55-59 and accept/decline actions at lines 66-84.
   - Evidence: `apps/web-next/src/routes/connected/invites/route.tsx` implements Web Share API plus clipboard fallback at lines 190-214.
6. Testing: Playwright configurado — REJECT
   - Evidence: `@playwright/test` is listed in `apps/web-next/package.json` devDependencies, but no `playwright.config.*` exists and no Playwright tests/screenshots were found.

## Must NOT Have / guardrail compliance

- No Framer Motion — PASS
  - Evidence: grep for `framer-motion` under `apps/web-next` returned no matches.
- No editor de runas completo — PASS
  - Evidence: `RunesTab.tsx` exists as a champ-select tab component; no `RuneEditor` marker was found in the web-next search.
- No chat/amigos replicados — PASS WITH LIMITED CONFIDENCE
  - Evidence: no dedicated chat/friends implementation was found during targeted guardrail searches. Existing invites/social actions are within the plan scope.
- No landscape orientation soportado — PASS
  - Evidence: `LandscapeWarning.tsx` blocks mobile landscape with a fixed overlay instead of supporting landscape layout.
- No cambios en lógica de negocio — PASS WITH LIMITED CONFIDENCE
  - Evidence: inspected changes appear UI-focused and existing Rift/LCU hooks are still used. A full historical diff was not part of this audit input, so this is static-code confidence, not commit-diff proof.
- No breaking changes en API — PASS WITH LIMITED CONFIDENCE
  - Evidence: required `ddragon-client.ts` extension exposes `ChampionMetadata`; tests/build pass. No API break was found in inspected code, but this audit did not compare public API signatures against a baseline.

## Prior evidence reviewed

- `.sisyphus/plans/web-next-ui-redesign.md`: Definition of Done lines 74-80, Must Have lines 82-88, guardrails lines 90-99.
- `.sisyphus/evidence/web-next-redesign/t1-audit.md`: confirms foundation utilities and `ChampionMetadata` work.
- `.sisyphus/evidence/web-next-redesign/t7-audit.md`: confirms preconnect/lazy-loading audit and documents Chrome/Lighthouse limitation.
- `.sisyphus/notepads/web-next-ui-redesign/learnings.md`: confirms Chrome is unavailable in this environment and champ-select lazy image strategy is `data-src` + `IntersectionObserver`.

## Blocking issues before approval

1. Add/configure Playwright for `apps/web-next` (`playwright.config.ts`) and provide screenshot evidence for `/`, `/connected/lobby`, `/connected/champ-select`, and `/connected/invites` at the required mobile/tablet widths.
2. Produce Lighthouse mobile evidence with score ≥ 80 in a Chrome-enabled environment, or get explicit plan acceptance that the documented no-Chrome fallback is sufficient.
3. Update Champ Select champions grid to use Data Dragon splash art, or amend the plan/acceptance criteria if square champion icons are intentionally accepted instead.
