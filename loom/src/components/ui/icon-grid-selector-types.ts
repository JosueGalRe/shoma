export interface IconGridSelectorItem<T> {
  id: T
  iconUrl: string
  name: string
  disabled?: boolean
}

export interface IconGridSelectorProps<T> {
  items: IconGridSelectorItem<T>[]
  selectedId: T | undefined
  onSelect: (id: T) => void
  columns?: number
}
