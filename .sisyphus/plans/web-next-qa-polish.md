# Plan: Web Next QA Polish & Accessibility Fixes

**Created:** 2026-05-01
**Status:** In Progress
**Branch:** web-next-rolldown-i18n
**Parent Plan:** web-next-visual-completion

## Context

The visual migration is complete. The QA audit identified non-critical but important issues that should be fixed before the app is considered production-ready. This plan addresses those findings.

## Tasks

### T1: Fix Pending Button States

- [x] **T1.1:** Wire `championActionPending` into `ChampSelectCard` to disable champion hover/ban/lock buttons during in-flight actions
- [x] **T1.2:** Wire `spellUpdatePending` into `SpellsCard` to disable spell buttons during in-flight updates

### T2: Add Missing Accessibility Labels

- [x] **T2.1:** Add `aria-label` to connect code input in `connect-entry-form.tsx`
- [x] **T2.2:** Add `aria-label` to invite-by-name input in `InvitePanel.tsx`
- [x] **T2.3:** Add `aria-label` to role preference selects in `RolePreferencesCard.tsx`
- [x] **T2.4:** Add `aria-label` to champion search input in `champ-select/route.tsx`
- [x] **T2.5:** Add `aria-label` to rune-page rename input in `rune-panel/index.tsx`
- [x] **T2.6:** Add `aria-label` to icon-only buttons in `SpellsCard.tsx`, `ChampSelectCard.tsx`, and `rune-panel/index.tsx`

### T3: Mobile Responsive Improvements

- [x] **T3.1:** Fix `LobbyHeader` crowding on 375px (allow wrap or reduce font size on small screens)
- [x] **T3.2:** Fix champion skeleton grid overflow on 375px (use responsive grid columns instead of fixed `grid-cols-5`)
- [x] **T3.3:** Fix invite action button row compression on narrow screens (allow flex-wrap)

### T4: Hardcoded Colors → Semantic Tokens (Technical Debt)

- [x] **T4.1:** Audit all `.tsx` files for hardcoded Tailwind arbitrary values (`bg-[#010a13]`, `text-[#c8a96e]`, etc.)
- [x] **T4.2:** Replace hardcoded colors with semantic Tailwind classes defined in `styles.css` where applicable

## Acceptance Criteria

1. No buttons can be double-clicked during pending API calls.
2. All form inputs and icon-only buttons have accessible labels.
3. Layouts don't break on 375px viewports.
4. Build passes, tests pass.

## Technical Constraints

- Use existing design tokens only
- Do not add new dependencies
- Maintain TypeScript strict mode compliance

## Definition of Done

All QA findings from the visual migration audit are resolved.
