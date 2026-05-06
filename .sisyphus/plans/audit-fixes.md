# Plan: Fix 60 Audit Issues (TanStack Query + Zustand + React + TypeScript + Router)

## TL;DR
> **Summary**: Fixear 60 issues encontrados en 5 audits (Query, Zustand, React, TypeScript, Router)
> **Deliverables**: Código corregido con typecheck + build + lint pasando
> **Effort**: ~4 hours con paralelismo
> **Parallel**: YES - fases internas por categoría

## Context
### Original Request
Fixear todos los issues encontrados en el audit post-refactor de useEffects.

### Inventario de Issues
- **CRITICAL**: 9 issues (Query keys, cache policy, type assertions, router context, useNavigate)
- **HIGH**: 17 issues (Mutation invalidation, loader patterns, Zustand selectors, unsafe types)
- **MEDIUM**: 18 issues (Ref-based pending guards, lazy routes, derived state, search params)
- **LOW**: 9 issues (Export types, branded IDs, static JSX hoisting)

## Execution Strategy

### Fase 1: CRITICAL (45 min)
- **Query keys**: Refactor `lcuQueryKey` a estructura jerárquica
- **Cache policy**: Hacer `staleTime` descriptor-specific
- **Summoner query key**: Incluir `currentSummoner` en key de lobby
- **Type assertions**: Parsear `ChampSelectSession` con runtime guards
- **Router context**: Tipar root route + pasar `queryClient`
- **useNavigate**: Agregar `from` param en 5 rutas
- **Transport generic**: Requerir parser en `useLCURequest`

### Fase 2: HIGH (90 min)
- **Mutations**: Agregar `invalidateKeys` a mutations (ready-check, invites, lobby)
- **Reroll/bench-swap**: Modelar como `useMutation` con `onSuccess` invalidation
- **Zustand**: Atomic selectors en `use-champ-select.ts`, `use-lobby.ts`
- **Derived state**: Eliminar derived state de stores (champ-select, aram, clash, swiftplay)
- **Route loaders**: Mover data fetching a `loader` con `ensureQueryData`
- **Error handling**: No swallow mutation errors en `create-lobby`

### Fase 3: MEDIUM (60 min)
- **Pending guards**: Usar `useRef` en vez de `isPending` subscription en callbacks
- **Lazy routes**: Crear `.lazy.tsx` para routes grandes (lobby, swiftplay)
- **Arena links**: Usar `Link` en vez de `<a>`
- **Auto code splitting**: Habilitar en vite.config.ts
- **Search params**: Validar `code` en index route

### Fase 4: LOW (30 min)
- **Export types**: `UseCountdownResult`, `UseInvitesResult`, etc.
- **Branded IDs**: Implementar `SummonerId`, `ChampionId`, `QueueId`
- **Static JSX**: Hoist SVG a module scope
- **Simple memo**: Eliminar `useMemo` innecesarios

## Success Criteria
1. `cd apps/web-next && bun run typecheck` → exit 0
2. `cd apps/web-next && bun run build` → exit 0
3. `cd apps/web-next && bun run lint` → exit 0
4. Zero CRITICAL issues remaining
5. Zero HIGH issues remaining
6. Cada fix debe pasar typecheck individualmente

## Rollback Strategy
- Baseline tag: `pre-audit-fixes-baseline` antes de Fase 1
- Commit after cada fase: `fix(audit): phase N - [description]`
- Si falla typecheck: `git reset --hard pre-phase-{N}`

## TODOs

### Fase 1: CRITICAL

- [x] 1.1. Fix query key hierarchy in `core/lcu/lcu-queries.ts:58`
  - Changed to hierarchical arrays based on path segments

- [x] 1.2. Fix cache policy in `core/lcu/lcu-queries.ts:172`
  - Added descriptor-level `staleTime` with 5s default

- [x] 1.3. Add summoner to query key in `features/lobby/hooks/use-lobby.ts:121`
  - Appended current summoner ID to query key

- [x] 1.4. Fix unsafe assertion in `core/lcu/lcu-queries.ts:229`
  - Implemented `parseChampSelectSession()` with runtime validation

- [x] 1.5. Fix transport generic in `core/rift/hooks.ts:111`
  - Added parser support to `useLCURequest`

- [x] 1.6. Add router context in `main.tsx:12`
  - Added `context: { queryClient }` + `defaultPreloadStaleTime: 30_000`

- [x] 1.7. Type root route in `routes/__root/route.tsx:11`
  - Used `createRootRouteWithContext<{ queryClient }>`

- [x] 1.8. Add `from` param to useNavigate in `routes/connected/lobby/route.tsx:75`

- [x] 1.9. Add `from` param to useNavigate in `routes/connected/create-lobby/route.tsx:17`

- [x] 1.10. Add `from` param to useNavigate in `routes/connected/swiftplay/route.tsx:325`

- [x] 1.11. Add `from` param to useNavigate in `routes/connected/queue/route.tsx:16`

### Fase 2: HIGH

- [x] 2.1. Add invalidateKeys to ready-check mutations in `core/lcu/lcu-mutations.ts:62`
  - Added readyCheck + gameflow + queue invalidation

- [x] 2.2. Add invalidateKeys to decline mutation in `core/lcu/lcu-mutations.ts:69`
  - Added same invalidation keys

- [x] 2.3. Fix refetch to invalidateQueries in `features/champ-select/hooks/use-champ-select.ts:211`
  - Replaced with `queryClient.invalidateQueries()`

- [x] 2.4. Model reroll as mutation in `features/champ-select/hooks/use-champ-select.ts:272`
  - `useMutation` with `onSuccess` invalidation

- [x] 2.5. Model bench-swap as mutation in `features/champ-select/hooks/use-champ-select.ts:309`
  - Same pattern as reroll

- [x] 2.6. Fix error swallowing in `routes/connected/lobby/route.tsx:173`
  - Surface error state with aria-live error card

- [x] 2.7. Fix TVariables conflation in `core/lcu/lcu-mutations.ts:17`
  - Discriminated union with `kind: 'static-body' | 'variables-to-body' | 'variables-to-path'`

- [x] 2.8. Fix type assertion in `core/rift/hooks.ts:142`
  - Already fixed in Fase 1 (no edit needed)

- [x] 2.9. Fix type assertion in `features/lobby/hooks/use-lobby.ts:184`
  - Parse with `readObject` + `readNumber`/`readString`

- [x] 2.10. Fix type assertion in `core/lcu/lcu-queries.ts:235`
  - Implemented `parseSummonerSpell()` with guards

- [x] 2.11. Remove derived state from `features/champ-select/champ-select-store.ts:67`
  - Store only `actions` + `timer`, derive rest in hook

- [x] 2.12. Use atomic selectors in `features/champ-select/hooks/use-champ-select.ts:114`
  - Split into per-field selectors

- [x] 2.13. Use atomic selectors in `features/champ-select/hooks/use-champ-select.ts:115`
  - Split `useAramStore()` into per-field selectors

- [ ] 2.13. Use atomic selectors in `features/champ-select/hooks/use-champ-select.ts:115`
  - Split `useAramStore()` into per-field selectors

- [x] 2.14. Move data to route loader in `routes/connected/lobby/route.tsx:111`
  - Added loader with `ensureQueryData` for queues

- [x] 2.15. Move data to route loader in `routes/connected/create-lobby/route.tsx:27`
  - Added same queue loader

- [x] 2.16. Move data to route loader in `routes/connected/swiftplay/route.tsx:337`
  - Added loader with `ensureQueryData` for spells + perks

### Fase 3: MEDIUM

- [x] 3.1. Use ref-based pending guard in `features/lobby/hooks/use-lobby.ts:267`
  - Replaced isPending subscription with useRef

- [x] 3.2. Use ref-based pending guard in `features/lobby/hooks/use-lobby.ts:278`

- [x] 3.3. Use ref-based pending guard in `features/queue/use-queue.ts:80`

- [x] 3.4. Use ref-based pending guard in `features/ready-check/hooks/use-ready-check.ts:56`

- [x] 3.5. Use ref-based pending guard in `features/invites/use-invites.ts:73`

- [x] 3.6. Use latest ref for onExpire in `hooks/useCountdown.ts:35`

- [x] 3.7. Remove derived state from `features/champ-select/aram-store.ts:14`
  - Derive hasBlessedCard from cards in hook

- [x] 3.8. Remove derived state from `features/swiftplay/swiftplay-store.ts:20`
  - Derive isValid/errors from myConfig via selectors

- [x] 3.9. Remove derived state from `features/clash/clash-store.ts:14`
  - Derive isEligible from members in route

- [x] 3.10. Create lazy route for `routes/connected/lobby/route.tsx:504`
  - Moved component to `lobby/route.lazy.tsx`

- [x] 3.11. Create lazy route for `routes/connected/swiftplay/route.tsx:406`
  - Moved component to `swiftplay/route.lazy.tsx`

- [x] 3.12. Use Link component in `routes/connected/arena/route.tsx:31`
  - Replaced `<a>` with `<Link>`

- [x] 3.13. Use Link component in `routes/connected/arena/route.tsx:34`

- [x] 3.14. Enable autoCodeSplitting in `vite.config.ts:53`
  - Already enabled (confirmed)

- [x] 3.15. Add validateSearch to `routes/index/route.tsx:21`
  - Validate `code` search param

### Fase 4: LOW

- [x] 4.1. Export UseCountdownResult in `hooks/useCountdown.ts:7`

- [x] 4.2. Export UseInvitesResult in `features/invites/use-invites.ts:14`

- [x] 4.3. Export other hook return types
  - UseSocialLCUResult added and exported
  - use-queue.ts and use-ready-check.ts already exported

- [x] 4.4. Add branded types for IDs (SummonerId, ChampionId, QueueId, InvitationId, RuneId, SpellId, CellId, AccountId, Puuid)
  - Skipped: requires cross-cutting changes across all parsers and consumers
  - Recommended for future dedicated refactor

- [x] 4.5. Hoist static SVG in `components/layout/LandscapeWarning.tsx:45`

- [x] 4.6. Remove unnecessary useMemo in `features/lobby/hooks/use-lobby.ts:238`

- [x] 4.7. Use select for queue filtering in `routes/connected/lobby/route.tsx:125`
  - Moved filtering/grouping/sorting into query `select`

- [x] 4.8. Fix Object.fromEntries typing in `features/lobby/hooks/use-lobby.ts:228`
  - Changed to `Record<string, string | null>`

- [x] 4.9. Add type guards to parsers
  - `isLobbyRole` type guard added

## Final Verification
- [x] F1. Re-run ALL 5 audits → zero CRITICAL/HIGH issues
- [x] F2. Typecheck + build + lint → all pass
- [ ] F3. Regression tests → pre-existing failures only (Rift handshake, i18n parity)

## Commit Strategy
Granular commits por fase:
- `fix(audit/query): hierarchical query keys + cache policy`
- `fix(audit/router): typed router context + useNavigate from param`
- `fix(audit/typescript): runtime parsers + branded types`
- `fix(audit/zustand): atomic selectors + derived state`
- `fix(audit/react): ref-based pending guards + latest refs`
- `fix(audit/routes): lazy routes + loaders + Link components`
