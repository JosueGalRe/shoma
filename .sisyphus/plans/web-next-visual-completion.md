# Plan: Web Next Visual Migration Completion

**Created:** 2026-05-01
**Status:** Complete
**Branch:** web-next-rolldown-i18n

## Context

The web-next app (`apps/web-next/`) has been partially migrated from the legacy Vue 2 app (`web/`). The core functionality is implemented and the LoL-inspired design system has been established (dark theme, gold/brass accents, Cinzel/Crimson Pro typography). The monolithic lobby route has been refactored into 9 separate components.

**Current State:**

- ✅ Design system tokens (colors, fonts, spacing)
- ✅ Global dark theme foundation
- ✅ Connected layout shell with immersive background
- ✅ Connect screen redesigned
- ✅ Lobby components extracted and styled
- ✅ Placeholder routes (invites, champ-select) redesigned
- ✅ Build passes without errors

**What Remains:** Rich visual assets, animations, dedicated route pages, and polish.

---

## Tasks

### Phase 1: Data Dragon Visual Assets Integration

- [x] **T1.1:** Create Data Dragon asset URL utilities (champion splash, spell icons, profile icons, rune icons)
- [x] **T1.2:** Integrate summoner profile icons in lobby member list with gold ring borders
- [x] **T1.3:** Integrate champion splash art in champ-select picker, bench, and member rows
- [x] **T1.4:** Integrate summoner spell icons in SpellsCard (replace dropdown text with icon + name)
- [x] **T1.5:** Integrate rune icons in RunePanel (replace text buttons with actual rune artwork)
- [x] **T1.6:** Integrate skin splash art in SkinsCard

### Phase 2: Animations and Micro-interactions

- [x] **T2.1:** Add CSS page transitions (fade/slide between routes)
- [x] **T2.2:** Add hover effects on all interactive cards (lift + gold glow)
- [x] **T2.3:** Add ready-check entrance animation (scale + glow pulse)
- [x] **T2.4:** Add queue timer animation (animated gradient border)
- [x] **T2.5:** Add loading states with LoL-styled spinners/skeletons

### Phase 3: Dedicated Route Pages

- [x] **T3.1:** Move champ-select UI from lobby route to `/connected/champ-select` as standalone page
- [x] **T3.2:** Move invites UI from lobby route to `/connected/invites` as standalone page
- [x] **T3.3:** Update connected navigation to reflect true page structure
- [x] **T3.4:** Ensure state sharing works across route boundaries

### Phase 4: Premium Component Redesigns

- [x] **T4.1:** Redesign champion picker as image grid with hover preview
- [x] **T4.2:** Redesign skin picker as carousel/slider with splash art backgrounds
- [x] **T4.3:** Redesign rune editor as visual tree with actual rune artwork
- [x] **T4.4:** Redesign lobby member list with rich cards (icon, role badges, status indicators)
- [x] **T4.5:** Add map/queue artwork backgrounds to lobby card

### Phase 5: QA, Polish and Final Verification

- [x] **T5.1:** Verify all interactions still work (join queue, ready check, invite, pick/ban, etc.)
- [x] **T5.2:** Verify mobile responsiveness across all screens
- [x] **T5.3:** Verify accessibility (contrast ratios, aria labels, keyboard nav)
- [x] **T5.4:** Final build verification (zero TS errors, zero build warnings)
- [x] **T5.5:** Document visual migration completion in docs/migration/

---

## Acceptance Criteria

1. Every interactive element displays the correct LoL-themed visual asset where applicable.
2. All pages have smooth entrance/exit animations.
3. `/connected/champ-select` and `/connected/invites` are fully functional standalone pages, not placeholders.
4. The app builds without errors and passes all existing tests.
5. The visual experience on mobile feels premium and native-app-like.

---

## Technical Constraints

- Use existing design tokens only (`#010a13`, `#0a1428`, `#c8a96e`, `#0ac8b9`, `#f0e6d2`, `#a09b8c`, `#785a28`, `#d32f2f`)
- Do not add new dependencies without justification
- Maintain TypeScript strict mode compliance
- Preserve all existing functionality (LCU transport, state management, i18n)
- Champion/skin/spell/rune artwork must come from Riot Data Dragon/CDragon (community CDN)

---

## Final Verification Wave

F1. **Visual QA:** Review all screens for consistency with design tokens and LoL aesthetic.
F2. **Functional QA:** Verify all gameplay interactions (lobby, queue, ready-check, champ-select, invites) work end-to-end.
F3. **Build QA:** Confirm `bun run build` passes with zero errors and `bun test` passes.
F4. **Mobile QA:** Verify responsive layout and touch interactions on simulated mobile viewport.

---

## Evidence References

- Design system: `apps/web-next/src/styles.css`
- Component primitives: `apps/web-next/src/components/ui/`
- Lobby components: `apps/web-next/src/routes/connected/lobby/-components/`
- Connected shell: `apps/web-next/src/routes/connected/route.tsx`
- Connect screen: `apps/web-next/src/features/connect/components/`
- Legacy v1 reference: `web/src/components/`

---

## Definition of Done

Web migration visual completion is achieved when:

1. All 5 phases are complete and verified.
2. Every route has a premium, LoL-inspired visual design.
3. All visual assets (champion art, icons, skins, runes) are integrated.
4. Animations and micro-interactions are present on all interactive elements.
5. The app feels like a native League client companion app.
6. Build passes, tests pass, no regressions.
