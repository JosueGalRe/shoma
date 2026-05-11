export function SocialSkeleton() {
  return (
    <div className="space-y-4 p-4">
      {Array.from({ length: 3 }).map((_, groupIndex) => (
        <div key={groupIndex} className="rounded-sm border border-lol-border-subtle bg-lol-navy-900/40 p-3">
          <div className="mb-3 h-4 w-24 animate-pulse rounded bg-lol-navy-800" />
          <div className="space-y-2">
            {Array.from({ length: 2 }).map((_, friendIndex) => (
              <div key={friendIndex} className="flex items-center gap-3">
                <div className="size-8 animate-pulse rounded-full bg-lol-navy-800" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 w-28 animate-pulse rounded bg-lol-navy-800" />
                  <div className="h-2.5 w-16 animate-pulse rounded bg-lol-navy-800" />
                </div>
                <div className="h-7 w-14 animate-pulse rounded bg-lol-navy-800" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
