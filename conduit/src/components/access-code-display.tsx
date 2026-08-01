import { accessCodeDisplayStyles } from './access-code-display-styles'

interface AccessCodeDisplayProps {
  accessCode: string | null
}

export function AccessCodeDisplay({ accessCode }: AccessCodeDisplayProps) {
  const { code, skeleton, skeletonDigit } = accessCodeDisplayStyles()

  if (accessCode) {
    return <div className={code()}>{accessCode.match(/./g)?.join(' ')}</div>
  }

  return (
    <div className={skeleton()}>
      {Array.from({ length: 6 }).map((_, i) => {
        return <span key={i} className={skeletonDigit()} style={{ animationDelay: `${i * 0.1}s` }} />
      })}
    </div>
  )
}
