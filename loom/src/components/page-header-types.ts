import type { ReactNode } from 'react'

export interface PageHeaderBadge {
  label: string
  icon?: ReactNode
}

export interface PageHeaderProps {
  title: string
  subtitle?: string
  badges?: PageHeaderBadge[]
  actions?: ReactNode
}
