export function SocialSkeleton() {
  return (
    <div className="space-y-4 p-4">
      {Array.from({ length: 3 }).map((unusedGroup, groupIndex) => {
        void unusedGroup

        return (
          <div key={groupIndex} className="border-border bg-secondary/40 rounded-sm border p-3">
            <div className="bg-secondary mb-3 h-4 w-24 animate-pulse rounded" />

            <div className="space-y-2">
              {Array.from({ length: 2 }).map((unusedFriend, friendIndex) => {
                void unusedFriend

                return (
                  <div key={friendIndex} className="flex items-center gap-3">
                    <div className="bg-secondary size-8 animate-pulse rounded-full" />

                    <div className="flex-1 space-y-1.5">
                      <div className="bg-secondary h-3 w-28 animate-pulse rounded" />

                      <div className="bg-secondary h-2.5 w-16 animate-pulse rounded" />
                    </div>

                    <div className="bg-secondary h-7 w-14 animate-pulse rounded" />
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
