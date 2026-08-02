import { useRef, useState } from 'react'

type LongPressTimer = ReturnType<typeof globalThis.setTimeout>

export function useChampionPreview() {
  const [previewChampionKey, setPreviewChampionKey] = useState<string | null>(null)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const timerRef = useRef<LongPressTimer | null>(null)
  const isLongPressTriggered = useRef(false)

  const handleLongPressDown = (championKey: string) => {
    isLongPressTriggered.current = false

    timerRef.current = globalThis.setTimeout(() => {
      isLongPressTriggered.current = true
      setPreviewChampionKey(championKey)
      setIsPreviewOpen(true)
    }, 800)
  }

  const handleLongPressUp = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }

  const closePreview = () => {
    setIsPreviewOpen(false)
  }

  return { closePreview, handleLongPressDown, handleLongPressUp, isLongPressTriggered, isPreviewOpen, previewChampionKey }
}
