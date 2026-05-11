
- 2026-05-08: Added `apps/web-next/src/features/queue/queue-store.ts` to React Doctor `ignore.files` because the audit classified the whole store module as `explicit-re-export-keep`: it is a feature public API surface and should not be deleted just to satisfy knip/files.
- 2026-05-08: Kept `LobbyMemberProps.showRoles` as the one remaining boolean because the task explicitly required that discriminated-union shape; management eligibility is now represented by the `variant` discriminant instead of three operational booleans.
- Kept the component exports and logic intact; only filenames/import paths changed.
