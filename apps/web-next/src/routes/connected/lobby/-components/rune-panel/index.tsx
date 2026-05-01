import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

import { buildRuneIconUrl } from '../../-lobby-utils'
import {
  STAT_SHARD_LABELS,
  STAT_SHARD_ROWS,
} from '../../-lobby-runes'
import type { ConnectedRunePanelProps } from './rune-panel-types'
import { isPrimaryRuneSelected, isStatShardSelected } from './rune-panel-utils'

export function ConnectedRunePanel(props: ConnectedRunePanelProps) {
  const {
    title,
    createLabel,
    renamePlaceholder,
    renameLabel,
    deleteLabel,
    noRunesLabel,
    primaryTreeLabel,
    secondaryTreeLabel,
    statShardsLabel,
    selectEditableHintLabel,
    noEditorDataLabel,
    runePages,
    activeRunePage,
    editableActiveRunePage,
    primaryRuneStyle,
    secondaryRuneStyle,
    runeStyles,
    selectedSecondaryRuneIds,
    runePageActionPending,
    runeUpdatePending,
    runeEditPending,
    runePageNameDraft,
    onRunePageNameDraftChange,
    onCreateRunePage,
    onRenameActiveRunePage,
    onDeleteActiveRunePage,
    onSelectRunePage,
    onSelectPrimaryRuneStyle,
    onSelectPrimaryRune,
    onSelectSecondaryRuneStyle,
    onSelectSecondaryRune,
    onSelectStatShard,
  } = props

  return (
    <div className='mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3 sm:col-span-2'>
      <p className='font-semibold text-slate-800'>{title}</p>
      <div className='mt-2 flex flex-wrap gap-2'>
        <Button
          className='font-display h-8 rounded-lg bg-slate-700 px-3 text-white hover:bg-slate-800'
          disabled={runePageActionPending}
          onClick={onCreateRunePage}
          type='button'
        >
          {createLabel}
        </Button>
        {activeRunePage ? (
          <>
            <input
              className='h-8 rounded-lg border border-slate-300 bg-white px-2 text-sm text-slate-800'
              aria-label='Rune page name'
              disabled={runePageActionPending || !activeRunePage.isEditable}
              onChange={(event) => {
                onRunePageNameDraftChange(event.target.value)
              }}
              placeholder={renamePlaceholder}
              value={runePageNameDraft}
            />
            <Button
              className='font-display h-8 rounded-lg bg-sky-600 px-3 text-white hover:bg-sky-700'
              disabled={runePageActionPending || !activeRunePage.isEditable || runePageNameDraft.trim().length === 0}
              onClick={onRenameActiveRunePage}
              type='button'
            >
              {renameLabel}
            </Button>
            <Button
              className='font-display h-8 rounded-lg bg-rose-600 px-3 text-white hover:bg-rose-700'
              disabled={runePageActionPending || !activeRunePage.isEditable}
              onClick={onDeleteActiveRunePage}
              type='button'
            >
              {deleteLabel}
            </Button>
          </>
        ) : null}
      </div>

      {runePages.length > 0 ? (
        <div className='mt-2 flex flex-wrap gap-2'>
          {runePages.map((runePage) => (
            <Button
              className='font-display h-8 rounded-lg bg-slate-700 px-3 text-white hover:bg-slate-800'
              disabled={runeUpdatePending}
              key={runePage.id}
              onClick={() => {
                onSelectRunePage(runePage.id)
              }}
              type='button'
              variant={runePage.isActive ? 'default' : 'secondary'}
            >
              {runePage.name}
            </Button>
          ))}
        </div>
      ) : (
        <div className='mt-2 flex gap-2'>
          <Skeleton className='h-12 w-12 rounded-full' />
          <Skeleton className='h-12 w-12 rounded-full' />
          <Skeleton className='h-12 w-12 rounded-full' />
          <Skeleton className='h-12 w-12 rounded-full' />
          <Skeleton className='h-12 w-12 rounded-full' />
        </div>
      )}

      {editableActiveRunePage && primaryRuneStyle && secondaryRuneStyle ? (
        <div className='mt-4 rounded-xl border border-[#785a28]/30 bg-[#0a1428] p-4 shadow-lg'>
          <div className='flex flex-col md:flex-row gap-6'>
            {/* Primary Tree (60%) */}
            <div className='flex-[3] flex flex-col items-center'>
              {/* Style Selectors */}
              <div className='flex w-full justify-center border-b border-[#785a28]/30 mb-6'>
                {runeStyles.map((style) => {
                  const isActive = primaryRuneStyle.id === style.id
                  return (
                    <button
                      className={`px-4 py-2 text-sm font-medium transition-colors relative ${
                        isActive ? 'text-[#c8a96e]' : 'text-slate-400 hover:text-slate-200'
                      }`}
                      disabled={runeEditPending}
                      key={`primary-style-${style.id}`}
                      onClick={() => {
                        onSelectPrimaryRuneStyle(style.id)
                      }}
                      type='button'
                    >
                      {style.name}
                      {isActive && (
                        <div className='absolute bottom-0 left-0 right-0 h-0.5 bg-[#c8a96e] shadow-[0_0_8px_rgba(200,169,110,0.8)]' />
                      )}
                    </button>
                  )
                })}
              </div>

              {/* Primary Runes */}
              <div className='flex flex-col items-center space-y-6 w-full'>
                {primaryRuneStyle.slots.map((slot, slotIndex) => {
                  const isKeystone = slotIndex === 0
                  return (
                    <div className='flex justify-center gap-4 w-full' key={`primary-slot-${slotIndex}`}>
                      {slot.runes.map((rune) => {
                        const isSelected = isPrimaryRuneSelected(editableActiveRunePage, slotIndex, rune.id)
                        const isKeystone = slotIndex === 0
                        const sizeClass = isKeystone ? 'h-16 w-16' : 'h-12 w-12'
                        const keystoneBorder = isKeystone && !isSelected ? 'border-2 border-[#c8a96e]/40' : ''
                        
                        return (
                          <button
                            className={`rounded-full bg-[#010a13]/40 transition-all ${sizeClass} ${keystoneBorder} ${
                              isSelected
                                ? 'ring-2 ring-[#c8a96e] ring-offset-2 ring-offset-[#0a1428] shadow-[0_0_15px_rgba(200,169,110,0.5)] opacity-100'
                                : 'opacity-60 hover:opacity-100 border border-[#785a28]/30 hover:border-[#c8a96e]/50'
                            }`}
                            disabled={runeEditPending}
                            key={`primary-rune-${slotIndex}-${rune.id}`}
                            onClick={() => {
                              onSelectPrimaryRune(slotIndex, rune.id)
                            }}
                            type='button'
                          >
                            <img
                              alt={rune.name}
                              className='h-full w-full rounded-full object-cover'
                              src={buildRuneIconUrl(rune.id) ?? undefined}
                            />
                          </button>
                        )
                      })}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Secondary Tree (40%) */}
            <div className='flex-[2] flex flex-col items-center'>
              {/* Style Selectors */}
              <div className='flex w-full justify-center border-b border-[#785a28]/30 mb-6'>
                {runeStyles.map((style) => {
                  const isActive = secondaryRuneStyle.id === style.id
                  return (
                    <button
                      className={`px-3 py-2 text-sm font-medium transition-colors relative ${
                        isActive ? 'text-[#c8a96e]' : 'text-slate-400 hover:text-slate-200'
                      } ${style.id === primaryRuneStyle.id ? 'opacity-30 cursor-not-allowed' : ''}`}
                      disabled={runeEditPending || style.id === primaryRuneStyle.id}
                      key={`secondary-style-${style.id}`}
                      onClick={() => {
                        onSelectSecondaryRuneStyle(style.id)
                      }}
                      type='button'
                    >
                      {style.name}
                      {isActive && (
                        <div className='absolute bottom-0 left-0 right-0 h-0.5 bg-[#c8a96e] shadow-[0_0_8px_rgba(200,169,110,0.8)]' />
                      )}
                    </button>
                  )
                })}
              </div>

              {/* Secondary Runes */}
              <div className='flex flex-col items-center space-y-5 w-full'>
                {secondaryRuneStyle.slots.slice(1).map((slot, slotIndex) => (
                  <div className='flex justify-center gap-4 w-full' key={`secondary-slot-${slotIndex}`}>
                    {slot.runes.map((rune) => {
                      const isSelected = selectedSecondaryRuneIds.includes(rune.id)
                      return (
                        <button
                          className={`h-10 w-10 rounded-full bg-[#010a13]/40 transition-all ${
                            isSelected
                              ? 'ring-2 ring-[#c8a96e] ring-offset-2 ring-offset-[#0a1428] shadow-[0_0_15px_rgba(200,169,110,0.5)] opacity-100'
                              : 'opacity-60 hover:opacity-100 border border-[#785a28]/30 hover:border-[#c8a96e]/50'
                          }`}
                          disabled={runeEditPending}
                          key={`secondary-rune-${slotIndex}-${rune.id}`}
                          onClick={() => {
                            onSelectSecondaryRune(rune.id, secondaryRuneStyle)
                          }}
                          type='button'
                        >
                          <img
                            alt={rune.name}
                            className='h-full w-full rounded-full object-cover'
                            src={buildRuneIconUrl(rune.id) ?? undefined}
                          />
                        </button>
                      )
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Stat Shards */}
          <div className='mt-8 flex flex-col items-center border-t border-[#785a28]/30 pt-6'>
            <div className='flex flex-col space-y-3'>
              {STAT_SHARD_ROWS.map((slotOptions, slotIndex) => (
                <div className='flex justify-center gap-3' key={`stat-shard-slot-${slotIndex}`}>
                  {slotOptions.map((runeId) => {
                    const isSelected = isStatShardSelected(editableActiveRunePage, slotIndex, runeId)
                    return (
                      <button
                        className={`h-8 rounded-lg px-3 text-xs font-medium transition-all ${
                          isSelected
                            ? 'bg-[#c8a96e] text-[#0a1428] shadow-[0_0_10px_rgba(200,169,110,0.5)]'
                            : 'bg-[#010a13]/60 text-slate-300 border border-[#785a28]/30 hover:border-[#c8a96e]/50 hover:text-white'
                        }`}
                        disabled={runeEditPending}
                        key={`stat-shard-${slotIndex}-${runeId}`}
                        onClick={() => {
                          onSelectStatShard(slotIndex, runeId)
                        }}
                        type='button'
                      >
                        {STAT_SHARD_LABELS[runeId] ?? String(runeId)}
                      </button>
                    )
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : activeRunePage && !activeRunePage.isEditable ? (
        <p className='mt-2 text-sm text-slate-500'>{selectEditableHintLabel}</p>
      ) : runePages.length > 0 ? (
        <p className='mt-2 text-sm text-slate-500'>{noEditorDataLabel}</p>
      ) : null}
    </div>
  )
}
