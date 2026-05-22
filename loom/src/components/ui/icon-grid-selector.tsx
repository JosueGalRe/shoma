export interface IconGridSelectorProps<T> {
  items: Array<{ id: T; iconUrl: string; name: string; disabled?: boolean }>
  selectedId: T | undefined
  onSelect: (id: T) => void
  columns?: number
}

export function IconGridSelector<T>({ items, selectedId, onSelect, columns = 3 }: IconGridSelectorProps<T>) {
  return (
    <div className='grid gap-3' style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
      {items.map((item) => {
        const isSelected = selectedId === item.id
        return (
          <button
            key={String(item.id)}
            type='button'
            disabled={item.disabled}
            onClick={() => {
              if (!item.disabled) {
                onSelect(item.id)
              }
            }}
            className={`focus-visible:ring-ring flex min-h-[44px] min-w-[44px] flex-col items-center gap-2 rounded-xl border p-3 transition-all focus-visible:ring-2 focus-visible:outline-none ${
              isSelected
                ? 'border-primary bg-secondary/50 scale-105 shadow-[0_0_20px_var(--shoma-primary)]'
                : 'border-border hover:border-primary/50 hover:bg-secondary/50'
            } ${item.disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
          >
            <img alt={item.name} className='size-10 rounded-full object-cover' loading='lazy' src={item.iconUrl} />
            <span className={`text-center text-xs leading-tight font-medium ${isSelected ? 'text-primary' : 'text-muted'}`}>
              {item.name}
            </span>
          </button>
        )
      })}
    </div>
  )
}
