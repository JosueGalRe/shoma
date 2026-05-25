import type { HTMLAttributes } from 'react'

import type { BadgeVariantProps } from './badge-styles'

export interface BadgeProps extends HTMLAttributes<HTMLDivElement>, BadgeVariantProps {}
