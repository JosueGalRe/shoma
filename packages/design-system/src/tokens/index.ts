export const semanticTokenNames = [
  "background",
  "foreground",
  "primary",
  "primary-foreground",
  "secondary",
  "accent",
  "muted",
  "border",
  "ring",
  "destructive",
] as const;

export type SemanticTokenName = (typeof semanticTokenNames)[number];

export type SemanticTokenCssVariable<Name extends SemanticTokenName = SemanticTokenName> =
  `--shoma-${Name}`;

export type SemanticTokenContract = {
  readonly [Name in SemanticTokenName]: SemanticTokenCssVariable<Name>;
};

export const semanticTokenContract = Object.fromEntries(
  semanticTokenNames.map((name) => [name, `--shoma-${name}`]),
) as SemanticTokenContract;
