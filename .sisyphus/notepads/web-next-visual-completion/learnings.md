Added `BackgroundLayer type="map"` plus a `relative z-10 space-y-6` wrapper to the connected route pages for consistent layered layout.

`swiftplay` is loader-only, so it now exposes a minimal page component that renders the same background shell without extra content.
2026-05-07: Lobby horizontal scroll was constrained by missing width caps on the lobby main/grid wrappers and the connected scroll container. Adding `w-full`/`max-w-full`, `overflow-x-hidden`, and `truncate` kept the lobby content within the viewport without changing structure.
