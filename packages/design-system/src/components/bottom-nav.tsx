import type { ReactNode } from "react";

export interface BottomNavProps {
  items: {
    id: string;
    label: string;
    icon: ReactNode;
    badge?: number;
    onClick: () => void;
  }[];
}

export function BottomNav({ items }: BottomNavProps) {
  return (
    <nav
      aria-label="Lobby navigation"
      className="fixed bottom-0 left-0 right-0 z-30 flex h-[56px] items-center justify-around border-t border-border bg-secondary/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-sm"
    >
      {items.map((item) => (
        <button
          key={item.id}
          onClick={item.onClick}
          aria-label={item.label}
          className="relative flex min-h-[44px] min-w-[44px] flex-col items-center justify-center rounded-lg px-3 py-1 transition-colors hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {item.icon}
          <span className="mt-0.5 text-[10px] text-muted">{item.label}</span>
          {item.badge !== undefined && item.badge > 0 && (
            <span
              aria-hidden="true"
              className="absolute right-2 top-0 flex min-h-[16px] min-w-[16px] items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-foreground"
            >
              {item.badge > 99 ? "99+" : item.badge}
            </span>
          )}
        </button>
      ))}
    </nav>
  );
}
