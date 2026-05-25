import { errorTextKey, type TranslationKey } from '../app-utils'

export function ErrorBanner({
  error,
  t,
}: {
  error: 'lcu_unavailable' | 'relay_unreachable' | 'registration_failed' | 'server_error'
  t: (key: TranslationKey) => string
}) {
  return <div className="error-banner">{t(errorTextKey(error))}</div>
}
