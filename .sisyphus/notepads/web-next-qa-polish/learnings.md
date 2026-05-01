## Learnings

- `ConnectedChampSelectRoute` already toggles `championActionPending` and `spellUpdatePending` around the LCU calls; the UI fix only needed prop threading plus `disabled` guards on the interactive buttons.
- Accessibility-only updates in `apps/web-next` were straightforward: unlabeled inputs and icon-only buttons accepted plain `aria-label` strings without needing any translation-key changes.
- Mobile overflow fixes in lobby components were best handled with `flex-wrap` on the outer row and `grid-cols-3 sm:grid-cols-4 md:grid-cols-5` for loading skeletons; fixed-width skeleton cells are what caused the 375px overflow.
- `bun run build` passed after the layout-only changes; local `lsp_diagnostics` still could not run here because `typescript-language-server` is not installed in this environment.
- For the accessibility pass, the final scope should stay limited to the four unlabeled controls in `connect-entry-form`, `InvitePanel`, `RolePreferencesCard`, and `rune-panel`; the champ-select and spell controls were already cleaned up by the previous, broader pass and should not be reintroduced.
- This 375px lobby polish only needed className tweaks: `flex-wrap` on `LobbyHeader`, responsive skeleton columns plus `aspect-square w-full` in `ChampSelectCard`, and `flex-wrap` on the invite action row.
- `lsp_diagnostics` was attempted on all three changed files, but the TypeScript language server is unavailable in this environment; `bun run build` in `apps/web-next` still completed successfully.
