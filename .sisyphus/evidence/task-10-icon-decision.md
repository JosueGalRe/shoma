Decision: keep Lucide as the icon system for @shoma/design-system.

Reasoning:

- Loom already uses lucide-react broadly, so keeping Lucide avoids a second icon library and preserves visual consistency.
- The design system should stay lightweight; a custom library would add maintenance overhead without solving a real gap.
- Lucide's DynamicIcon supports name-based rendering for the few places that need runtime icon selection while still letting consumers import specific icons directly when static usage is better for tree-shaking.
- The wrapper can standardize size tokens and design-token colors without re-exporting the full icon set.

Outcome:

- Implemented a thin Icon wrapper over Lucide DynamicIcon.
- Default color uses --shoma-foreground, with optional token-based tones.
