## 2026-05-04 - Lobby dodge penalty

- The lobby keeps a local countdown seeded from `useLobby().dodgePenalty` so the UI updates every second without waiting for LCU observer updates. When the countdown reaches zero, the shared queue-store penalty is cleared to re-enable queue entry.

## 2026-05-04 - Ready-check vibration

- Vibration is guarded in the shared notification helper with `document.hidden` and API availability checks so ready-check notifications fall back silently when vibration is unsupported or the tab is backgrounded.
