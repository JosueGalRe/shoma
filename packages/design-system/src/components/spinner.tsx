import * as React from "react";

function cn(...inputs: Array<string | undefined | null | false>) {
  return inputs.filter(Boolean).join(" ");
}

export interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  label?: string;
}

export function Spinner({ className, label = "Loading", ...props }: SpinnerProps) {
  return (
    <div
      className={cn(
        "inline-block h-6 w-6 animate-spin rounded-full border-2 border-current border-t-transparent text-primary",
        className
      )}
      {...props}
    >
      <span className="sr-only">{label}</span>
    </div>
  );
}
