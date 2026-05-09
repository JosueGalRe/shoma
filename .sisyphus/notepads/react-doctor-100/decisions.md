
- 2026-05-08: Added `apps/web-next/src/features/queue/queue-store.ts` to React Doctor `ignore.files` because the audit classified the whole store module as `explicit-re-export-keep`: it is a feature public API surface and should not be deleted just to satisfy knip/files.
