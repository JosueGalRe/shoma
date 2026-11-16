import { createContext, useContext } from 'react'

// Where the kit's modals, sheets and toasts open: null is the whole window. A box that contains its fixed children
// (a column of a wide layout, Social's panel) keeps them over it instead
export const OverlayContainer = createContext<HTMLElement | null>(null)

export function useOverlayContainer(): HTMLElement | null {
  return useContext(OverlayContainer)
}
