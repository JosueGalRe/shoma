import * as React from "react";
import { User } from "lucide-react";

import { cn } from "../lib/cn";

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string;
  alt?: string;
  status?: "online" | "away" | "offline";
  size?: "sm" | "md" | "lg";
}

const statusColors = {
  online: "border-primary",
  away: "border-accent",
  offline: "border-muted",
};

const sizeClasses = {
  sm: "h-8 w-8",
  md: "h-10 w-10",
  lg: "h-14 w-14",
};

const Avatar = React.forwardRef<HTMLDivElement, AvatarProps>(
  ({ className, src, alt, status, size = "md", ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "relative inline-flex items-center justify-center overflow-hidden rounded-full border-2",
          status ? statusColors[status] : "border-border",
          sizeClasses[size],
          className
        )}
        {...props}
      >
        {src ? (
          <img src={src} alt={alt} className="h-full w-full object-cover" />
        ) : (
          <User className="text-muted" size={size === "sm" ? 16 : size === "md" ? 20 : 28} />
        )}
      </div>
    );
  }
);
Avatar.displayName = "Avatar";

export { Avatar };
