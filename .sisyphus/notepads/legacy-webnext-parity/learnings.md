## 2026-05-04 - Lobby dodge penalty

- `queueDescriptor` and `queueSearchDescriptor` both read `/lol-matchmaking/v1/search`, but they parse different domain shapes. They need distinct React Query keys so lobby queue status does not overwrite queue search state used by `readDodgePenalty`.
- `queue.dodgePenalty` already exists in English and Spanish translations with `{{time}}` interpolation.

## 2026-05-04 - Ready-check vibration

- Ready-check vibration already flows through `notify('ready-check')`, so the safest fix is to keep vibration centralized in `notification-manager.ts` rather than duplicating it in the ready-check hook.
- 2026-05-04: Mobile polish tasks 26/28/29 implemented in apps/web-next. Queue-pop asset is served from public/queue-pop.mp3; notification-manager registers one-shot click/touch audio unlock and skips iOS playback until unlocked. PWA install prompt is captured in features/install/use-install-prompt and exposed as a conditional landing-page button. Safe-area support requires viewport-fit=cover plus existing SafeArea env() padding.
