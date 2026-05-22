import { relaunch } from '@tauri-apps/plugin-process'
import { check } from '@tauri-apps/plugin-updater'
import { useState } from 'react'

import { Button, Card, Icon } from '@shoma/design-system'

interface UpdatePromptProps {
  version: string
  date?: string
  notes?: string
  onDismiss: () => void
}

export function UpdatePrompt({ version, date, notes, onDismiss }: UpdatePromptProps) {
  const [isInstalling, setIsInstalling] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const handleInstall = async () => {
    try {
      setIsInstalling(true)
      setError(null)
      const update = await check()

      if (!update) {
        setError('No update found.')
        setIsInstalling(false)
        return
      }

      let downloaded = 0
      let contentLength = 0

      await update.downloadAndInstall((event) => {
        switch (event.event) {
          case 'Started':
            contentLength = event.data.contentLength || 0
            setProgress(0)
            break
          case 'Progress':
            downloaded += event.data.chunkLength
            if (contentLength > 0) {
              setProgress(Math.round((downloaded / contentLength) * 100))
            }
            break
          case 'Finished':
            setProgress(100)
            break
        }
      })
      await relaunch()
    } catch (e) {
      console.error('Failed to install update:', e)
      setError(e instanceof Error ? e.message : String(e))
      setIsInstalling(false)
    }
  }

  const handleLater = () => {
    localStorage.setItem('conduit-dismissed-version', version)
    onDismiss()
  }

  return (
    <Card className='absolute right-4 bottom-4 left-4 z-[150] flex flex-col gap-3 border border-[var(--shoma-border-gold)]/30 bg-[var(--conduit-surface)]/95 p-4 shadow-xl backdrop-blur-md'>
      <div className='flex items-start justify-between gap-2'>
        <div className='flex flex-col gap-1'>
          <div className='flex items-center gap-2 text-sm font-semibold text-[var(--shoma-primary)]'>
            <Icon name='download' size='sm' />
            <span>Update available: v{version}</span>
          </div>
          {date && (
            <div className='text-xs text-[var(--shoma-muted)]' suppressHydrationWarning>
              {new Date(date).toLocaleDateString()}
            </div>
          )}
        </div>
        {!isInstalling && (
          <button
            onClick={handleLater}
            className='cursor-pointer border-none bg-transparent p-1 text-[var(--shoma-muted)] transition-colors hover:text-[var(--shoma-text)]'
          >
            <Icon name='x' size='sm' />
          </button>
        )}
      </div>

      {notes && <div className='max-h-20 overflow-y-auto text-left text-xs text-[var(--shoma-text)]/80'>{notes}</div>}

      {error && (
        <div className='rounded border border-[var(--shoma-destructive)]/20 bg-[var(--shoma-destructive)]/10 p-2 text-xs text-[var(--shoma-destructive)]'>
          {error}
        </div>
      )}

      <div className='mt-1 flex items-center justify-end gap-2'>
        {isInstalling ? (
          <div className='flex w-full items-center gap-3'>
            <div className='h-1.5 flex-1 overflow-hidden rounded-full bg-[var(--shoma-surface)]'>
              <div
                className='h-full bg-[var(--shoma-primary)] transition-all duration-200 ease-out'
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className='min-w-[3ch] text-right text-xs text-[var(--shoma-muted)]'>{progress}%</span>
          </div>
        ) : (
          <>
            <Button variant='secondary' onClick={handleLater} className='min-h-0 px-3 py-1 text-xs'>
              Later
            </Button>
            <Button variant='primary' onClick={handleInstall} className='min-h-0 px-3 py-1 text-xs'>
              {error ? 'Retry' : 'Install now'}
            </Button>
          </>
        )}
      </div>
    </Card>
  )
}
