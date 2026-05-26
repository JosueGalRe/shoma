# packages/design-system KNOWLEDGE BASE

**Generated:** 2026-05-13

## OVERVIEW

Shared design-system package for Sho'ma. Provides UI primitives, tokens, and theme utilities consumed by `loom` and `conduit`. Built with React 19, Tailwind CSS v4, and `tailwind-variants`.

## STRUCTURE

```
packages/design-system/
├── src/
│   ├── components/           # UI primitives (Button, Card, Input, etc.)
│   ├── styles/               # Theme CSS, tokens, typography
│   ├── tokens/               # Semantic design tokens
│   └── index.ts              # Barrel export
└── tests/
    ├── button.test.ts
    ├── contrast.test.ts
    ├── icon.test.ts
    ├── token-contract.test.ts
    └── typography.test.ts
```

## WHERE TO LOOK

| Task            | Location            | Notes                                  |
| --------------- | ------------------- | -------------------------------------- |
| UI primitives   | `src/components/**` | React components with tailwind-variants |
| Theme tokens    | `src/styles/`       | Tailwind v4 theme integration          |
| Semantic tokens | `src/tokens/`       | CSS custom properties                  |
| Component tests | `tests/`            | TDD-driven contract and contrast tests |

## CONVENTIONS

- **Primitives:** Built with `tailwind-variants` + Tailwind v4 utility classes
- **Tokens:** Semantic CSS custom properties; consumed via Tailwind theme config
- **Exports:** Barrel export from `src/index.ts`; CSS files exported via `exports` field
- **Tests:** TDD approach; contract tests verify token consistency, contrast tests verify a11y

## ANTI-PATTERNS

- Do not add heavy runtime dependencies; keep it lightweight
- Do not break token contracts without updating `token-contract.test.ts`
