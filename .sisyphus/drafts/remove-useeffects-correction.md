# Draft: Remove useEffects

## Status

**IN PROGRESS** — Corrigiendo plan con datos exactos del codebase

## Key Corrections from Exploration

- **Count**: 52 useEffects (not 51) en 18 archivos
- **Clasification**: CAN_REMOVE (23), MAYBE_REMOVE (14), SHOULD_KEEP (15)
- **Missing from original plan**: `core/rift/hooks.ts:40` (ref sync), `champ-select:108`, `champ-select:114`, `champ-select:132`, `champ-select:146`
- **Line numbers**: All verified with grep -rn, exact line numbers confirmed

## Inventory Summary (from explore agent)

### CAN_REMOVE (23)

All mirror/state copy effects:

- invites/use-invites.ts:46
- lobby/use-lobby.ts:209,218,260,290,304,308,312,316
- queue/use-queue.ts:55,64
- ready-check/use-ready-check.ts:40
- champ-select/components/rune-editor.tsx:56
- champ-select/hooks/use-champ-select.ts:98,102,108,114
- social/use-social-lcu.ts:58,98,107
- routes/connected/custom/route.tsx:35
- routes/connected/lobby/route.tsx:199
- routes/connected/champ-select/route.tsx:42
- routes/connected/clash/route.tsx:50
- core/rift/hooks.ts:40

### MAYBE_REMOVE (14)

Async flows and notifications:

- invites/use-invites.ts:66,81
- lobby/use-lobby.ts:320,358,370,382,394
- queue/use-queue.ts:89
- connect/use-connection-flow.ts:18
- ready-check/use-ready-check.ts:68
- champ-select/hooks/use-champ-select.ts:132,146
- reconnect-utils.ts:32

### SHOULD_KEEP (15)

External system sync:

- LandscapeWarning.tsx:8
- reconnect-utils.ts:45
- queue/use-queue.ts:99
- connect/use-connection-flow.ts:33
- ready-check/use-ready-check.ts:54
- install/use-install-prompt.ts:12
- champ-select/hooks/use-champ-select.ts:123
- social/use-social-lcu.ts:86
- social/use-invite-friend.ts:54
- core/lcu/lcu-observer-sync.ts:16
- core/rift/hooks.ts:44,127,171
- routes/connected/lobby/route.tsx:203

## Decisions Needed

- [ ] Confirmar que los 14 MAYBE_REMOVE se incluyen en el plan (podrían postergarse a fase 2)
- [ ] Decidir si `core/rift/hooks.ts:40` (ref sync) se elimina o se mantiene

## Scope Boundaries

- INCLUDE: All CAN_REMOVE + MAYBE_REMOVE effects
- EXCLUDE: SHOULD_KEEP effects (only document, don't modify)
