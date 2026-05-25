export const semanticTokenNames = [
  'surface',
  'surface-elevated',
  'surface-hover',
  'primary',
  'accent',
  'text',
  'text-muted',
  'border',
  'border-gold',
  'error',
  'success',
] as const

export type SemanticTokenName = (typeof semanticTokenNames)[number]

export type SemanticTokenCssVariable<Name extends SemanticTokenName = SemanticTokenName> = `--shoma-${Name}`

export type SemanticTokenContract = {
  readonly [Name in SemanticTokenName]: SemanticTokenCssVariable<Name>
}

export const semanticTokenContract = {
  accent: '--shoma-accent',
  border: '--shoma-border',
  'border-gold': '--shoma-border-gold',
  error: '--shoma-error',
  primary: '--shoma-primary',
  success: '--shoma-success',
  surface: '--shoma-surface',
  'surface-elevated': '--shoma-surface-elevated',
  'surface-hover': '--shoma-surface-hover',
  text: '--shoma-text',
  'text-muted': '--shoma-text-muted',
} satisfies SemanticTokenContract
