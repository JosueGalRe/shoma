import type { ReactNode } from "react";

import { cn } from "../lib/cn";

export interface AmbientBackgroundProps {
  children: ReactNode;
  className?: string;
}

export function AmbientBackground({
  children,
  className,
}: AmbientBackgroundProps) {
  return (
    <div
      className={cn(
        "relative flex h-full w-full flex-col overflow-hidden bg-surface text-text",
        className
      )}
    >
      <div
        className="pointer-events-none absolute -left-40 top-0 h-[500px] w-[500px] rounded-full bg-primary/10 blur-[150px] animate-[pulse_4s_ease-in-out_infinite]"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -right-40 bottom-0 h-[500px] w-[500px] rounded-full bg-accent/10 blur-[150px] animate-[pulse_5s_ease-in-out_infinite]"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute left-1/3 top-1/3 h-96 w-96 rounded-full bg-border-gold/10 blur-[120px] animate-[pulse_6s_ease-in-out_infinite]"
        aria-hidden="true"
      />

      <div className="relative z-10 flex h-full w-full flex-col overflow-hidden">
        {children}
      </div>
    </div>
  );
}
