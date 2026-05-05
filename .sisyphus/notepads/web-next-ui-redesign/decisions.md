# Decisions

- Kept the queue and ready-check logic untouched; only presentation and button layout changed.
- Used exact Spanish screen copy for the redesigned states to match the requested LoL feel and the task brief.
- Used the existing UI primitives instead of introducing new components or abstractions for these two screens.
- Softer queue helper copy and formatted ready-check countdown were kept as presentation-only fixes to improve the live QA feel without touching hook/timer logic.
## 2026-05-04 — Connect screen implementation decisions

- Keep the LoL atmosphere in `ConnectScreen` as a single page-level shell, but keep connection logic inside `useConnectionFlow` unchanged.
- Use the shared `Input` and `Button` primitives so the connect form matches the rest of the new LoL UI system.
- Preserve the install CTA on `/` by wiring `useInstallPrompt()` through the route component.

## 2026-05-04
- Chose to gate the new Play screen on `members.length === 0 && !isLoading`, so the lobby UI only appears once the user is actually in a lobby or still loading state.
- Reused the existing lobby mode metadata instead of introducing new copy or hooks.
