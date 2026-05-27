interface AccessCodeDisplayProps {
  accessCode: string | null
}

export function AccessCodeDisplay({ accessCode }: AccessCodeDisplayProps) {
  if (accessCode) {
    return <div className="access-code">{accessCode.match(/./g)?.join(' ')}</div>
  }

  return (
    <div className="access-code-skeleton">
      {Array.from({ length: 6 }).map((_, i) => (
        <span key={i} className="access-code-skeleton-digit" style={{ animationDelay: `${i * 0.1}s` }} />
      ))}
    </div>
  )
}
