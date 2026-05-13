# Plan 05 T3 Accessibility Report

Target: WCAG 2.1 AA mobile via axe-core 4.10.2 and Playwright Mobile-360.

## lobby

Violation summary: critical 0, serious 0, moderate 0, minor 0

No axe violations found.

Reduced motion check: no active animations/transitions under prefers-reduced-motion: reduce

## role-picker

Violation summary: critical 0, serious 0, moderate 0, minor 0

No axe violations found.

Reduced motion check: no active animations/transitions under prefers-reduced-motion: reduce

## champion-picker-grid

Violation summary: critical 0, serious 0, moderate 5, minor 0

- moderate: heading-order — Heading levels should only increase by one
  - target: .text-2xl

- moderate: landmark-complementary-is-top-level — Aside should not be contained in another landmark
  - target: .motion-safe\:animate-fade-in-up-300 > aside

- moderate: landmark-main-is-top-level — Main landmark should not be contained in another landmark
  - target: .min-h-\[calc\(100vh-4rem\)\]

- moderate: landmark-no-duplicate-main — Document should not have more than one main landmark
  - target: .overflow-auto

- moderate: landmark-unique — Landmarks should have a unique role or role/label/title (i.e. accessible name) combination
  - target: .overflow-auto

Reduced motion check: no active animations/transitions under prefers-reduced-motion: reduce

## summoner-spell-selection

Violation summary: critical 0, serious 0, moderate 5, minor 0

- moderate: heading-order — Heading levels should only increase by one
  - target: .text-2xl

- moderate: landmark-complementary-is-top-level — Aside should not be contained in another landmark
  - target: .motion-safe\:animate-fade-in-up-300 > aside

- moderate: landmark-main-is-top-level — Main landmark should not be contained in another landmark
  - target: .min-h-\[calc\(100vh-4rem\)\]

- moderate: landmark-no-duplicate-main — Document should not have more than one main landmark
  - target: .overflow-auto

- moderate: landmark-unique — Landmarks should have a unique role or role/label/title (i.e. accessible name) combination
  - target: .overflow-auto

Reduced motion check: no active animations/transitions under prefers-reduced-motion: reduce

## rune-editor

Violation summary: critical 0, serious 0, moderate 5, minor 0

- moderate: heading-order — Heading levels should only increase by one
  - target: .text-2xl

- moderate: landmark-complementary-is-top-level — Aside should not be contained in another landmark
  - target: .motion-safe\:animate-fade-in-up-300 > aside

- moderate: landmark-main-is-top-level — Main landmark should not be contained in another landmark
  - target: .min-h-\[calc\(100vh-4rem\)\]

- moderate: landmark-no-duplicate-main — Document should not have more than one main landmark
  - target: .overflow-auto

- moderate: landmark-unique — Landmarks should have a unique role or role/label/title (i.e. accessible name) combination
  - target: .overflow-auto

Reduced motion check: no active animations/transitions under prefers-reduced-motion: reduce

## ban-phase

Violation summary: critical 0, serious 0, moderate 5, minor 0

- moderate: heading-order — Heading levels should only increase by one
  - target: .text-2xl

- moderate: landmark-complementary-is-top-level — Aside should not be contained in another landmark
  - target: .motion-safe\:animate-fade-in-up-300 > aside

- moderate: landmark-main-is-top-level — Main landmark should not be contained in another landmark
  - target: .min-h-\[calc\(100vh-4rem\)\]

- moderate: landmark-no-duplicate-main — Document should not have more than one main landmark
  - target: .overflow-auto

- moderate: landmark-unique — Landmarks should have a unique role or role/label/title (i.e. accessible name) combination
  - target: .overflow-auto

Reduced motion check: no active animations/transitions under prefers-reduced-motion: reduce

## pick-phase

Violation summary: critical 0, serious 0, moderate 5, minor 0

- moderate: heading-order — Heading levels should only increase by one
  - target: .text-2xl

- moderate: landmark-complementary-is-top-level — Aside should not be contained in another landmark
  - target: .motion-safe\:animate-fade-in-up-300 > aside

- moderate: landmark-main-is-top-level — Main landmark should not be contained in another landmark
  - target: .min-h-\[calc\(100vh-4rem\)\]

- moderate: landmark-no-duplicate-main — Document should not have more than one main landmark
  - target: .overflow-auto

- moderate: landmark-unique — Landmarks should have a unique role or role/label/title (i.e. accessible name) combination
  - target: .overflow-auto

Reduced motion check: no active animations/transitions under prefers-reduced-motion: reduce

## aram-bench

Violation summary: critical 0, serious 0, moderate 5, minor 0

- moderate: heading-order — Heading levels should only increase by one
  - target: .text-2xl

- moderate: landmark-complementary-is-top-level — Aside should not be contained in another landmark
  - target: .motion-safe\:animate-fade-in-up-300 > aside

- moderate: landmark-main-is-top-level — Main landmark should not be contained in another landmark
  - target: .min-h-\[calc\(100vh-4rem\)\]

- moderate: landmark-no-duplicate-main — Document should not have more than one main landmark
  - target: .overflow-auto

- moderate: landmark-unique — Landmarks should have a unique role or role/label/title (i.e. accessible name) combination
  - target: .overflow-auto

Reduced motion check: no active animations/transitions under prefers-reduced-motion: reduce

## ready-check-overlay

Violation summary: critical 0, serious 0, moderate 0, minor 0

No axe violations found.

Reduced motion check: no active animations/transitions under prefers-reduced-motion: reduce

## Fixes applied

- BottomSheet focus trapping now attaches after the portal renders, recomputes valid focusable elements on each Tab, handles zero-focusable sheets, and redirects escaped focus back into the dialog.
- Axe injection uses the locked local `axe-core` package instead of a remote CDN script.
- Shared button, debug toggle, and mobile social controls now meet the 44×44px touch target minimum measured by this suite.
- No critical or serious axe violations remained after scan.
