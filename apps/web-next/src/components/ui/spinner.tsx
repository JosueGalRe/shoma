import * as React from "react"
import { useTranslation } from 'react-i18next'
import { cn } from "@/lib/utils"

export type SpinnerProps = React.HTMLAttributes<HTMLDivElement>

export function Spinner({ className, ...props }: SpinnerProps) {
  const { t } = useTranslation()

  return (
    <div
      className={cn(
        "inline-block h-6 w-6 animate-spin rounded-full border-2 border-current border-t-transparent text-primary",
        className
      )}
      {...props}
    >
      <span className="sr-only">{t('common.loading')}</span>
    </div>
  )
}
