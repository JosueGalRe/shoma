import * as React from "react"
import { cn } from "@/lib/utils"

export function SkeletonShimmer({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  const [showFallback, setShowFallback] = React.useState(false)

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setShowFallback(true)
    }, 3000)
    return () => clearTimeout(timer)
  }, [])

  if (showFallback) {
    return (
      <div
        className={cn("rounded-md bg-lol-navy-800", className)}
        {...props}
      />
    )
  }

  return (
    <div
      className={cn(
        "rounded-md bg-gradient-to-r from-lol-navy-900 via-lol-navy-800 to-lol-navy-900 bg-[length:200%_100%] motion-safe:animate-shimmer",
        className
      )}
      {...props}
    />
  )
}
