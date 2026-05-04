import { useState } from 'react'

type ConnectEntryFormProps = {
  code: string
  setCode: (code: string) => void
  onSubmit: (code: string) => void
  onCancel: () => void
  isConnecting: boolean
}

export function ConnectEntryForm({ code, setCode, onSubmit, onCancel, isConnecting }: ConnectEntryFormProps) {
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (code.length !== 6) {
      setError('Code must be exactly 6 digits')
      return
    }
    setError(null)
    onSubmit(code)
  }

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6)
    setCode(value)
    if (value.length === 6) {
      setError(null)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6 w-full max-w-sm mx-auto mt-8">
      <div className="flex flex-col gap-2">
        <label htmlFor="code-input" className="text-sm font-medium text-muted-foreground uppercase tracking-wider text-center">
          Enter 6-digit code
        </label>
        <input
          id="code-input"
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={6}
          value={code}
          onChange={handleInput}
          disabled={isConnecting}
          className="h-16 text-center text-4xl tracking-[0.5em] font-mono bg-card border-2 border-border rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all disabled:opacity-50"
          autoFocus
        />
        {error && <p className="text-destructive text-sm text-center animate-pulse">{error}</p>}
      </div>

      <div className="flex gap-4">
        <button
          type="button"
          onClick={onCancel}
          disabled={isConnecting}
          className="flex-1 h-12 rounded-xl border border-border hover:bg-card hover:text-primary transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={code.length !== 6 || isConnecting}
          className="flex-1 h-12 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isConnecting ? 'Connecting...' : 'Connect'}
        </button>
      </div>
    </form>
  )
}
