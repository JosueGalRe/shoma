import { LcuHttpMethod } from '@mimic/protocol-contract'
import { AlertTriangle, CheckCircle2, Pencil, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

import { Button } from '@/components/ui/button'
import { useLCUObserver, useLCURequest } from '@core/rift/hooks'
import { runeRequestPaths, type RunePage, type RuneStyle, useRunesStore } from '../runes-store'

function runeTreeName(styles: RuneStyle[], styleId: number): string {
  return styles.find((style) => style.id === styleId)?.name ?? `Tree ${styleId}`
}

function perkName(styles: RuneStyle[], perkId: number): string {
  for (const style of styles) {
    for (const slot of style.slots) {
      const perk = slot.perks.find((candidate) => candidate.id === perkId)
      if (perk) {
        return perk.name ?? `Rune ${perkId}`
      }
    }
  }

  return `Rune ${perkId}`
}

function cloneWithReplacement(page: RunePage, previousPerkId: number, nextPerkId: number): RunePage {
  return {
    ...page,
    selectedPerkIds: page.selectedPerkIds.map((perkId) => (perkId === previousPerkId ? nextPerkId : perkId)),
  }
}

export function RunesPanel() {
  const currentPageRequest = useLCUObserver<RunePage>(runeRequestPaths.currentPage)
  const pagesRequest = useLCURequest<RunePage[]>(runeRequestPaths.pages, LcuHttpMethod.GET)
  const stylesRequest = useLCURequest<RuneStyle[]>(runeRequestPaths.styles, LcuHttpMethod.GET)
  const { currentPage, editRunePage, error, isEditing, presets, runeStyles, saveRunePage, selectPreset, selectedPreset, setRuneData, setRuneError, validation } =
    useRunesStore()
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    setRuneData({ currentPage: currentPageRequest.data, pages: pagesRequest.data, styles: stylesRequest.data })
  }, [currentPageRequest.data, pagesRequest.data, setRuneData, stylesRequest.data])

  useEffect(() => {
    const requestError = currentPageRequest.error ?? pagesRequest.error ?? stylesRequest.error
    if (requestError) {
      setRuneError(requestError)
    }
  }, [currentPageRequest.error, pagesRequest.error, setRuneError, stylesRequest.error])

  const editablePage = currentPage?.isEditable ? currentPage : null
  const primaryStyle = useMemo(() => runeStyles.find((style) => style.id === currentPage?.primaryStyleId), [currentPage?.primaryStyleId, runeStyles])
  const subStyle = useMemo(() => runeStyles.find((style) => style.id === currentPage?.subStyleId), [currentPage?.subStyleId, runeStyles])
  const isLoading = currentPageRequest.isLoading || pagesRequest.isLoading || stylesRequest.isLoading

  return (
    <>
      <Button
        variant='outline'
        className='w-full h-16 flex justify-between items-center px-6 border-gold-dim/30 bg-card/80 hover:bg-background/60 hover:border-primary/50 transition-all rounded-xl backdrop-blur-md'
        onClick={() => setIsOpen(true)}
      >
        <span className='font-display text-sm uppercase tracking-[0.1em] text-primary'>
          Runes
        </span>
        <div className='flex items-center gap-3'>
          <span className='text-sm font-semibold text-foreground'>
            {currentPage ? currentPage.name : 'Select Runes'}
          </span>
          <span className='text-muted-foreground'>›</span>
        </div>
      </Button>

      {isOpen && (
        <div className='fixed inset-0 z-50 flex flex-col justify-end bg-black/80 backdrop-blur-sm animate-in fade-in duration-200'>
          <div className='absolute inset-0' onClick={() => setIsOpen(false)} />
          <div className='relative bg-card border-t border-gold-dim/30 rounded-t-3xl p-6 pb-safe animate-in slide-in-from-bottom-full duration-300 max-h-[85vh] overflow-y-auto'>
            <div className='sticky top-0 bg-card z-10 pb-4 mb-4 border-b border-gold-dim/20 flex justify-between items-center'>
              <h2 className='font-display text-xl text-primary uppercase tracking-widest'>
                Runes
              </h2>
              <Button variant='ghost' size='icon' onClick={() => setIsOpen(false)} className='rounded-full'>
                <X className='h-6 w-6' />
              </Button>
            </div>

            <div className='space-y-6'>
              {isLoading ? <p className='text-sm text-muted-foreground'>Loading rune presets from the League client...</p> : null}

              <section aria-label='Rune presets' className='grid gap-3 sm:grid-cols-3'>
                {presets.map((preset, index) => (
                  <button
                    aria-pressed={selectedPreset === index}
                    className={`rounded-xl border-2 p-4 text-left transition-all ${
                      selectedPreset === index ? 'border-primary bg-primary/10 shadow-[0_0_15px_rgba(10,200,185,0.2)]' : 'border-gold-dim/30 bg-background/50 hover:border-primary/50'
                    }`}
                    key={preset.id}
                    onClick={() => {
                      void selectPreset(index)
                    }}
                    type='button'
                  >
                    <span className='block font-display text-xs tracking-[0.18em] text-primary uppercase'>Preset {index + 1}</span>
                    <span className='mt-2 block text-sm font-bold text-foreground'>{preset.name}</span>
                    <span className='mt-1 block text-xs text-muted-foreground'>
                      {runeTreeName(runeStyles, preset.primaryStyleId)} / {runeTreeName(runeStyles, preset.subStyleId)}
                    </span>
                  </button>
                ))}
              </section>

              {presets.length === 0 && !isLoading ? <p className='text-sm text-muted-foreground'>No rune presets are available from LCU yet.</p> : null}

              {error || !validation.isValid ? (
                <div className='flex items-center gap-3 rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive'>
                  <AlertTriangle className='h-5 w-5 shrink-0' />
                  <span>{error?.message ?? validation.error}</span>
                </div>
              ) : null}

              {currentPage ? (
                <section className='space-y-6 rounded-2xl border border-gold-dim/30 bg-background/60 p-6'>
                  <div className='flex flex-col sm:flex-row sm:items-start justify-between gap-4'>
                    <div>
                      <p className='text-xs tracking-[0.2em] text-muted-foreground uppercase font-semibold'>Current page</p>
                      <h2 className='mt-2 font-display text-2xl text-primary'>{currentPage.name}</h2>
                      <p className='text-sm text-muted-foreground mt-1'>
                        {runeTreeName(runeStyles, currentPage.primaryStyleId)} primary · {runeTreeName(runeStyles, currentPage.subStyleId)} secondary
                      </p>
                    </div>
                    <div className='flex gap-3 w-full sm:w-auto'>
                      <Button
                        disabled={!editablePage}
                        onClick={() => {
                          if (editablePage) {
                            editRunePage(editablePage)
                          }
                        }}
                        className='flex-1 sm:flex-none h-12 rounded-xl'
                        type='button'
                        variant='outline'
                      >
                        <Pencil className='h-4 w-4 mr-2' />
                        Edit
                      </Button>
                      <Button
                        disabled={!isEditing || !validation.isValid}
                        onClick={() => {
                          void saveRunePage()
                        }}
                        className='flex-1 sm:flex-none h-12 rounded-xl font-display tracking-widest uppercase bg-gradient-to-r from-primary to-teal-dim hover:from-teal hover:to-primary'
                        type='button'
                      >
                        Save
                      </Button>
                    </div>
                  </div>

                  {validation.isValid ? (
                    <div className='flex items-center gap-2 text-sm text-primary font-semibold'>
                      <CheckCircle2 className='h-5 w-5' />
                      Valid rune combination
                    </div>
                  ) : null}

                  <div className='grid gap-6 md:grid-cols-2'>
                    {[primaryStyle, subStyle].map((style) =>
                      style ? (
                        <div className='space-y-4' key={style.id}>
                          <p className='text-xs tracking-[0.2em] text-muted-foreground uppercase font-semibold border-b border-gold-dim/20 pb-2'>{style.name}</p>
                          {style.slots.map((slot, slotIndex) => (
                            <div className='flex flex-wrap gap-3' key={`${style.id}-${slotIndex}`}>
                              {slot.perks.map((perk) => {
                                const selected = currentPage.selectedPerkIds.includes(perk.id)
                                return (
                                  <button
                                    aria-pressed={selected}
                                    className={`rounded-full border-2 px-4 py-2 text-xs font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-40 ${
                                      selected ? 'border-primary bg-primary/20 text-primary shadow-[0_0_10px_rgba(10,200,185,0.2)]' : 'border-gold-dim/30 bg-background/60 text-muted-foreground hover:border-primary/50'
                                    }`}
                                    disabled={!isEditing || selected}
                                    key={perk.id}
                                    onClick={() => {
                                      const selectedInSlot = slot.perks.find((candidate) => currentPage.selectedPerkIds.includes(candidate.id))
                                      if (selectedInSlot) {
                                        editRunePage(cloneWithReplacement(currentPage, selectedInSlot.id, perk.id))
                                      }
                                    }}
                                    title={perkName(runeStyles, perk.id)}
                                    type='button'
                                  >
                                    {perk.name ?? perk.id}
                                  </button>
                                )
                              })}
                            </div>
                          ))}
                        </div>
                      ) : null,
                    )}
                  </div>
                </section>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
