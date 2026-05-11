export interface ConnectedFooterPanelsProps {
  installPromptAvailable: boolean
  installPromptBody: string
  installPromptButton: string
  installPromptHint: string
  isStandaloneMode: boolean
  logLines: string[]
  onShowInstallPrompt: () => void
  relayPreviewTitle: string
}

export function ConnectedFooterPanels(props: ConnectedFooterPanelsProps) {
  return (
    <div className='mt-6 space-y-4'>
      {props.logLines.length > 0 ? (
        <div className='rounded-xl border border-secondary bg-card/60 p-4'>
          <h4 className='font-display mb-2 text-xs uppercase tracking-widest text-gold-dim'>{props.relayPreviewTitle}</h4>
          <div className='max-h-32 space-y-1 overflow-y-auto text-xs text-muted-foreground'>
            {props.logLines.map((line, index) => (
              <p key={index}>{line}</p>
            ))}
          </div>
        </div>
      ) : null}
      {props.installPromptAvailable && !props.isStandaloneMode ? (
        <div className='rounded-xl border border-gold-dim bg-gradient-to-r from-primary/10 to-transparent p-4'>
          <p className='text-sm text-foreground'>{props.installPromptBody}</p>
          <p className='mt-1 text-xs text-muted-foreground'>{props.installPromptHint}</p>
          <button
            className='mt-2 rounded-lg bg-gradient-to-b from-primary to-gold-dim px-4 py-2 text-sm font-semibold text-background shadow-lg'
            onClick={props.onShowInstallPrompt}
            type='button'
          >
            {props.installPromptButton}
          </button>
        </div>
      ) : null}
    </div>
  )
}
