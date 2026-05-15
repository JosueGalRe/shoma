import * as React from "react";

import { cn } from "../lib/cn";

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  );
}

function SkeletonShimmer({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  const [showFallback, setShowFallback] = React.useState(false);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setShowFallback(true);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  if (showFallback) {
    return (
      <div
        className={cn("rounded-md bg-secondary", className)}
        {...props}
      />
    );
  }

  return (
    <div
      className={cn(
        "rounded-md bg-gradient-to-r from-background via-secondary to-background bg-[length:200%_100%] motion-safe:animate-shimmer",
        className
      )}
      {...props}
    />
  );
}

export { Skeleton, SkeletonShimmer };
