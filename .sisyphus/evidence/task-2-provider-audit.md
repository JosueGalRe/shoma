# Task 2 — RiftClientProvider audit

## Scope

Audited:
- `apps/web-next/src/core/rift/rift-client-provider.tsx`
- `apps/web-next/src/core/rift/rift-client.ts`
- `apps/web-next/src/core/rift/hooks.ts`
- `apps/web-next/src/core/rift/lcu-transport.ts`
- `apps/web-next/src/core/rift/route-loader.ts`
- `apps/web-next/src/core/state/rift-store.ts`

## Provider responsibilities

`RiftClientProvider` is the app-level owner for the shared runtime Rift connection. It reads the serializable connection intent from `useRiftStore` (`code` and `status`), computes whether connection should be active, creates a `RiftClient` through `useRiftClient`, derives one shared `LcuTransport` from that client, and exposes both through React context.

The provider itself is intentionally thin, but the lifecycle it activates is not simple state:
- `useRiftClient` creates and closes a `RiftClient` in a React effect keyed by `code` and `enabled`.
- `RiftClient` owns a live `WebSocket`, connect timeout, heartbeat interval, reconnect/connect timers, cryptographic session key, encryption readiness, and listener sets for data/open/close/state events.
- `RiftClient` persists `deviceID` in `localStorage` when sending encrypted identity during handshake (`getDeviceId()` lines 213-225, used by `#sendIdentity()` lines 448-462).
- `LcuTransport` wraps the connected client and owns pending request maps, request timeout handles, observer maps, reconnect/disconnect listener sets, and client event unsubscriptions.
- Downstream hooks (`useLCURequest`, `useLCUObserver`) subscribe/unsubscribe to transport reconnect/disconnect and observer lifecycles from React effects.

## What the Zustand store already owns

`rift-store.ts` owns durable, serializable connection UI state:
- `status`: `idle | connecting | connected | disconnected | error`
- `code`: normalized connection code, persisted ad hoc to `localStorage` key `conduitID` and `sessionStorage` key `mimicSessionCode`
- `error`: normalized error message
- actions for connect/disconnect/reconnect/setConnected/setError
- return URL session persistence helpers

It does not currently own a `RiftClient`, `WebSocket`, `LcuTransport`, subscriptions, pending requests, timers, or crypto keys. That separation is correct.

## What happens if the provider is removed

Removing the provider without an equivalent wrapper would force every consumer to either create its own `RiftClient`/`LcuTransport` or retrieve those mutable objects from a global store. The first option risks duplicate WebSocket connections and duplicated LCU subscriptions across features such as lobby, champ-select, social, queue, invites, ready-check, and route components. The second option moves non-serializable transport objects and effect cleanup responsibilities into Zustand, which makes teardown, StrictMode behavior, tests, and HMR cleanup harder to reason about.

Because `main.tsx` wraps the router with `RiftClientProvider`, all route and feature hooks currently share one connection boundary. Removing it would also break existing consumers of `useSharedRiftClient()` and `useSharedLCUTransport()` unless each call site is rewritten to accept a transport prop or selector.

## Risks

- The provider currently memoizes an `LcuTransport` from `riftClient.client`, but does not call `transport.close()` when the client changes or provider unmounts. The old transport's client listeners are attached to the old client, and the old client is closed by `useRiftClient` cleanup, so practical leakage is bounded; still, if this area is touched later, explicit transport disposal would be worth reviewing.
- `useRiftClient` sets `autoReconnect: false`, so reconnect semantics are currently controlled by React/store connection intent, not by `RiftClient`'s internal reconnect timer path.
- `deviceID` remains ad hoc localStorage outside `rift-store`; that is acceptable because it is transport identity metadata used during encrypted handshake, not UI state.
- There is also a route-loader-only ephemeral `RiftClient` for prefetching. It is self-contained and closes both transport and client in `finally`; it does not replace the provider's shared runtime client.

## Why this should not move into Zustand

Zustand should continue to hold serializable connection intent and UI-visible status/error, not the live transport layer. `RiftClient` and `LcuTransport` contain non-serializable objects (`WebSocket`, `CryptoKey`, timers, Sets, Maps, unsubscribe closures, pending Promise callbacks) whose lifecycle must be tied to React effects and explicit cleanup. Putting those objects in a store would couple global state mutation to external system synchronization, make persistence/devtools semantics unsafe, and increase the chance of stale subscriptions surviving route or StrictMode remounts.

## Recommendation

**MANTENER** `RiftClientProvider`.

Keep the provider as the shared external-system boundary between serializable Zustand connection intent and non-serializable Rift/LCU transport lifecycles. Do not migrate `RiftClient`, `LcuTransport`, WebSocket lifecycle, observer subscriptions, pending requests, timers, or crypto/session handshake objects into `rift-store`.

Migration plan is not applicable because the recommendation is not `REMOVER`.
