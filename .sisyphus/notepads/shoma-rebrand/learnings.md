## 2026-05-13 protocol-contract rename
- Renaming imports to `@shoma/protocol-contract` also required restoring the shared path alias inside `loom/tsconfig.json` and `leyline/tsconfig.json`, because both package configs override `paths` from the base config.
- Active-source grep verification stayed clean only after updating the two remaining imports in `loom/src/routes/connected/swiftplay/route.tsx` and `loom/src/features/champ-select/components/rune-editor.tsx`.
