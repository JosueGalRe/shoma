import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Skeleton } from '@/components/ui/skeleton'
import { buildSkinSplashUrl } from '../-lobby-utils'

interface SkinsCardProps {
  skinsForCurrentChampion: { id: number; championId: number; name: string; owned: boolean }[]
  championNamesById: Record<number, string>
  skinUpdatePending: boolean
  selectedSkinDraft: string
  setSelectedSkinDraft: (value: string) => void
  selectSkin: (value: string) => Promise<void>
}

export function SkinsCard({
  skinsForCurrentChampion,
  championNamesById,
  skinUpdatePending,
  selectedSkinDraft,
  setSelectedSkinDraft,
  selectSkin,
}: SkinsCardProps) {
  const { t } = useTranslation()
  const [currentIndex, setCurrentIndex] = useState(() => {
    const initialIndex = skinsForCurrentChampion.findIndex((skin) => String(skin.id) === selectedSkinDraft)

    return initialIndex >= 0 ? initialIndex : 0
  })

  useEffect(() => {
    const nextIndex = skinsForCurrentChampion.findIndex((skin) => String(skin.id) === selectedSkinDraft)

    setCurrentIndex(nextIndex >= 0 ? nextIndex : 0)
  }, [selectedSkinDraft, skinsForCurrentChampion])

  if (skinsForCurrentChampion.length === 0) {
    return (
      <div className='rounded-xl border border-[#785a28]/30 bg-[#010a13]/40 p-4 sm:col-span-2'>
        <p className='font-display text-sm uppercase tracking-[0.1em] text-[#c8a96e]'>
          {t(($) => $.connected.champSelectSkinsTitle)}
        </p>
        <div className='mt-4'>
          <Skeleton className='h-64 w-full rounded-xl' />
        </div>
      </div>
    )
  }

  const selectedSkin = skinsForCurrentChampion[currentIndex] || skinsForCurrentChampion[0]
  const championName = selectedSkin ? championNamesById[selectedSkin.championId] || null : null
  const selectedSkinNum = selectedSkin ? selectedSkin.id % 1000 : 0
  const splashUrl = championName ? buildSkinSplashUrl(championName, selectedSkinNum) || buildSkinSplashUrl(championName, 0) : null

  const goToIndex = (nextIndex: number) => {
    const nextSkin = skinsForCurrentChampion[nextIndex]

    if (!nextSkin) {
      return
    }

    const nextSkinId = String(nextSkin.id)

    setCurrentIndex(nextIndex)
    setSelectedSkinDraft(nextSkinId)
    void selectSkin(nextSkinId)
  }

  return (
    <div className='rounded-xl border border-[#785a28]/30 bg-[#010a13]/40 p-4 sm:col-span-2'>
      <p className='font-display text-sm uppercase tracking-[0.1em] text-[#c8a96e]'>
        {t(($) => $.connected.champSelectSkinsTitle)}
      </p>

      <div className='mt-4 flex flex-col gap-4'>
        <div className='relative overflow-hidden rounded-xl border border-[#785a28]/50 bg-[#010a13]/70'>
          <div className='relative h-80 w-full'>
            {splashUrl ? (
              <img
                src={splashUrl}
                alt={selectedSkin?.name || t(($) => $.connected.unknown)}
                className='h-full w-full object-cover object-top'
              />
            ) : (
              <div className='flex h-full w-full items-center justify-center bg-[#010a13] text-sm text-[#a09b8c]'>
                {t(($) => $.connected.unknown)}
              </div>
            )}

            <div className='absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#010a13] via-[#010a13]/60 to-transparent px-4 pb-4 pt-12'>
              <p className='font-display text-lg uppercase tracking-[0.12em] text-[#f0e6d2]'>
                {selectedSkin?.name || t(($) => $.connected.unknown)}
              </p>
              {championName ? <p className='text-xs text-[#c8a96e]'>{championName}</p> : null}
            </div>

            <button
              type='button'
              aria-label='Previous skin'
              disabled={skinUpdatePending || currentIndex === 0}
              onClick={() => goToIndex(currentIndex - 1)}
              className='absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-[#c8a96e] text-[#010a13] shadow-lg transition disabled:cursor-not-allowed disabled:opacity-40'
            >
              ‹
            </button>

            <button
              type='button'
              aria-label='Next skin'
              disabled={skinUpdatePending || currentIndex === skinsForCurrentChampion.length - 1}
              onClick={() => goToIndex(currentIndex + 1)}
              className='absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-[#c8a96e] text-[#010a13] shadow-lg transition disabled:cursor-not-allowed disabled:opacity-40'
            >
              ›
            </button>
          </div>
        </div>

        <div className='flex gap-2 overflow-x-auto pb-2 [scroll-snap-type:x_mandatory]'>
          {skinsForCurrentChampion.map((skin, index) => {
            const isSelected = index === currentIndex
            const skinNum = skin.id % 1000
            const thumbUrl = championName ? buildSkinSplashUrl(championName, skinNum) || buildSkinSplashUrl(championName, 0) : null

            return (
              <button
                key={skin.id}
                type='button'
                disabled={!skin.owned || skinUpdatePending}
                onClick={() => goToIndex(index)}
                className={`relative h-14 w-24 shrink-0 snap-start overflow-hidden rounded-lg border transition ${
                  isSelected ? 'border-[#c8a96e] ring-1 ring-[#c8a96e]' : 'border-[#785a28]/30 hover:border-[#c8a96e]/70'
                } ${!skin.owned ? 'opacity-40 grayscale' : 'opacity-100'}`}
              >
                {thumbUrl ? (
                  <img src={thumbUrl} alt='' className='h-full w-full object-cover object-top' />
                ) : (
                  <div className='flex h-full w-full items-center justify-center bg-[#010a13] text-[10px] text-[#a09b8c]'>
                    {skin.name}
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
