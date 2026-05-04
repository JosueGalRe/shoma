2026-05-01: The LCU lobby payload already exposes `members[].summoner.displayName` and `members[].summoner.profileIconId`; extracting those in `parseLobbyDetails` removes the need for separate summoner queries and keeps lobby member display stable.
2026-05-01: The `'/lol-lobby/v2/lobby'` member objects do not reliably include summoner identity fields; the safe path is to seed lobby members with null display data and resolve names/icons from `'/lol-summoner/v1/summoners/${id}'`.
2026-05-01: Upgrading to Vite 8 with `vite-plus` keeps the existing build config intact, but the dev script must call `vp dev` (not plain `vp`) and `server.forwardConsole` belongs in `defineConfig` from `vite-plus`.
2026-05-01: `@vitejs/plugin-react@6` no longer accepts the old inline `babel` option for React Compiler; the supported path is `react()` plus `@rolldown/plugin-babel` with `reactCompilerPreset()`.
2026-05-03: The remaining connected routes follow the same `react-i18next` pattern as lobby; wiring `useTranslation()` at the route level keeps text changes localized and avoids touching shared feature stores.
2026-05-03: Champ-select can render Data Dragon visuals directly from the existing hook payloads: spell `iconPath`/name, rune `id`, and skin `num` plus champion key are enough for basic asset previews.

- Added map artwork backgrounds to `QueueCard` and `LobbyMembersCard` using `buildMapIconUrl`.
- Used `bg-[#010a13]/80` overlay to ensure text readability over the map image.
- Conditioned the background display on `queueState` for `QueueCard` and `lobbyDetails` for `LobbyMembersCard`.
