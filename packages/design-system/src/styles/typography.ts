export const typographyScaleNames = ['xs', 'sm', 'base', 'lg', 'xl', '2xl', '3xl', '4xl'] as const

export const typographyFontFamilyNames = ['primary', 'display', 'mono'] as const

export const typographyFontWeightNames = ['regular', 'medium', 'semibold', 'bold'] as const

export type TypographyScaleName = (typeof typographyScaleNames)[number]
export type TypographyFontFamilyName = (typeof typographyFontFamilyNames)[number]
export type TypographyFontWeightName = (typeof typographyFontWeightNames)[number]

export type TypographyScaleCssVariable<Prefix extends string> = `--shoma-${Prefix}-${TypographyScaleName}`

export type TypographyFontFamilyCssVariable<Name extends TypographyFontFamilyName = TypographyFontFamilyName> =
  `--shoma-font-family-${Name}`

export type TypographyFontWeightCssVariable<Name extends TypographyFontWeightName = TypographyFontWeightName> =
  `--shoma-font-weight-${Name}`
