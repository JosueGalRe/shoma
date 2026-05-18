2026-05-01: Kept the fix type-only: removed the deprecated base config option, renamed `ky` options, and converted `Trans` values to strings without changing runtime behavior.
2026-05-02: Stabilized the lobby profile loader by depending on a derived summoner-id signature instead of the raw members array and by reading summoner/log callbacks from refs.
2026-05-03: Chose minimal lint-only fixes: added explicit error logging for localStorage failures and removed the unused `useRerollCard` destructure instead of changing store behavior.
2026-05-03: Kept the ARAM copy focused on cards rather than rerolls and shortened the primary button label to fit 320px without changing the action.

## 2026-05-03

- Kept `apps/web-next` alias mappings in `tsconfig.json`, but moved them back to app-relative paths after removing `baseUrl` so the build stays green.
- Fixed the remaining lint warnings in `lcu-transport.ts`, `hooks.ts`, `use-connection-flow.ts`, and `champ-select-store.ts` rather than narrowing lint scope.
- For the lobby route, translated the visible static copy directly in the route file and its route-local helpers instead of extracting new shared translation helpers.
- Added the requested `invites.none` key alongside the existing invite translations to satisfy the task’s locale contract.
- For the remaining web-next polish pass, kept the translation changes localized to the affected components and added versioned Data Dragon spell URLs using the existing latest-version hook instead of introducing a new asset helper.
- For the connection flow fix, kept the hook emitting locale keys (`connection.errors.*`) and moved translation to `ConnectionStatus` so user-facing copy stays centralized.
- For the champ-select spell icons, switched to a small canonical filename map in the route instead of guessing from the display name, since Data Dragon spell filenames diverge for several common spells.
- For the F4 rejection cleanup, kept store-level validation errors as translation keys and let the route render them, which avoids coupling store logic to i18n while keeping visible copy localized.
- Kept versioned URLs only for assets that actually require them (spell icons, rune icons) and switched champion splash/loading art to unversioned DDragon paths.

## 2026-05-07

- Added `aria-label` to lobby role-picker buttons using the translated role name while keeping the existing `title` tooltip.
