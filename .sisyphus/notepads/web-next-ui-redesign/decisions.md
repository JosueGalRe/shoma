## F2 Cleanup Pass - 2026-05-02

- Keep `getMapName` and `getQueueDescription` in `invites/route.tsx`; they are still used when rendering invite detail labels.
- Use a named `lobbyRuntimeResources` object in `invites/route.tsx` to avoid the language server misreporting the runtime helper destructuring.
- Remove the unused champ-select `ddragonVersion` prop because splash art URLs do not need the version string.
