import { Button } from '@/components/ui/button'

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
        <p className='mt-2 text-sm text-slate-500'>{noRunesLabel}</p>
      )}

      {editableActiveRunePage && primaryRuneStyle && secondaryRuneStyle ? (
        <div className='mt-3 space-y-3 rounded-xl border border-slate-200 bg-white p-3'>
          <div>
            <p className='text-xs font-semibold tracking-wide text-slate-600 uppercase'>{primaryTreeLabel}</p>
            <div className='mt-2 flex flex-wrap gap-2'>
              {runeStyles.map((style) => (
                <Button
                  className='h-8 rounded-lg px-3 text-xs'
                  disabled={runeEditPending}
                  key={`primary-style-${style.id}`}
                  onClick={() => {
                    onSelectPrimaryRuneStyle(style.id)
                  }}
                  type='button'
                  variant={primaryRuneStyle.id === style.id ? 'default' : 'secondary'}
                >
                  {style.name}
                </Button>
              ))}
            </div>

            <div className='mt-2 space-y-2'>
              {primaryRuneStyle.slots.map((slot, slotIndex) => (
                <div className='flex flex-wrap gap-2' key={`primary-slot-${slotIndex}`}>
                  {slot.runes.map((rune) => (
                    <Button
                      className='h-8 rounded-lg px-3 text-xs'
                      disabled={runeEditPending}
                      key={`primary-rune-${slotIndex}-${rune.id}`}
                      onClick={() => {
                        onSelectPrimaryRune(slotIndex, rune.id)
                      }}
                      type='button'
                      variant={
                        isPrimaryRuneSelected(editableActiveRunePage.selectedPerkIds, slotIndex, rune.id)
                          ? 'default'
                          : 'secondary'
                      }
                    >
                      {rune.name}
                    </Button>
                  ))}
                </div>
              ))}
            </div>
          </div>

          <div>
            <p className='text-xs font-semibold tracking-wide text-slate-600 uppercase'>{secondaryTreeLabel}</p>
            <div className='mt-2 flex flex-wrap gap-2'>
              {runeStyles.map((style) => (
                <Button
                  className='h-8 rounded-lg px-3 text-xs'
                  disabled={runeEditPending || style.id === primaryRuneStyle.id}
                  key={`secondary-style-${style.id}`}
                  onClick={() => {
                    onSelectSecondaryRuneStyle(style.id)
                  }}
                  type='button'
                  variant={secondaryRuneStyle.id === style.id ? 'default' : 'secondary'}
                >
                  {style.name}
                </Button>
              ))}
            </div>

            <div className='mt-2 space-y-2'>
              {secondaryRuneStyle.slots.slice(1).map((slot, slotIndex) => (
                <div className='flex flex-wrap gap-2' key={`secondary-slot-${slotIndex}`}>
                  {slot.runes.map((rune) => (
                    <Button
                      className='h-8 rounded-lg px-3 text-xs'
                      disabled={runeEditPending}
                      key={`secondary-rune-${slotIndex}-${rune.id}`}
                      onClick={() => {
                        onSelectSecondaryRune(rune.id)
                      }}
                      type='button'
                      variant={selectedSecondaryRuneIds.includes(rune.id) ? 'default' : 'secondary'}
                    >
                      {rune.name}
                    </Button>
                  ))}
                </div>
              ))}
            </div>
          </div>

          <div>
            <p className='text-xs font-semibold tracking-wide text-slate-600 uppercase'>{statShardsLabel}</p>
            <div className='mt-2 space-y-2'>
              {STAT_SHARD_ROWS.map((slotOptions, slotIndex) => (
                <div className='flex flex-wrap gap-2' key={`stat-shard-slot-${slotIndex}`}>
                  {slotOptions.map((runeId) => (
                    <Button
                      className='h-8 rounded-lg px-3 text-xs'
                      disabled={runeEditPending}
                      key={`stat-shard-${slotIndex}-${runeId}`}
                      onClick={() => {
                        onSelectStatShard(slotIndex, runeId)
                      }}
                      type='button'
                      variant={
                        isStatShardSelected(editableActiveRunePage.selectedPerkIds, slotIndex, runeId)
                          ? 'default'
                          : 'secondary'
                      }
                    >
                      {STAT_SHARD_LABELS[runeId] ?? String(runeId)}
                    </Button>
                  ))}
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
