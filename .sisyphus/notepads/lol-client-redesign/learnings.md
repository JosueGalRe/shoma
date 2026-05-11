## 2026-05-04 - Social LCU polish

- `SocialPanel` is rendered in both a desktop sidebar and mobile drawer, so containment needs both an outer viewport max-height and `min-h-0 overflow-y-auto` on the tab content areas.
- `useLatestDdragonVersion` from `@/core/http/ddragon-client` returns a TanStack query; profile icon URLs can safely return `undefined` while the version is loading.
- LCU friend groups are available at `/lol-chat/v1/friend-groups` and should be mapped by numeric `id` before parsing `/lol-chat/v1/friends` numeric `groupId` values.
- Replaced old Tailwind colors with LoL design tokens in create-lobby route.
- AppShell uses a radial gradient for a subtle dark texture.
- ConnectedRouteComponent uses a flex layout with a persistent sidebar on desktop and a drawer on mobile.
- SocialPanel is a placeholder component that fits into the sidebar/drawer.
