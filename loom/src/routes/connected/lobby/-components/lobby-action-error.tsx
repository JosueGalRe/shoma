import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui'
import { translateLcuError } from '@/features/diagnostics/eligibility-errors'

import type { LobbyActionErrorProps } from './lobby-action-error-types'

export function LobbyActionError({ actionError, t }: LobbyActionErrorProps) {
  const translatedActionError = translateLcuError(actionError)

  return (
    <div className="shrink-0 px-4">
      <Card aria-live="polite" className="border-destructive bg-destructive/10 backdrop-blur-md">
        <CardHeader className="py-2">
          <CardTitle className="text-sm">{t('errors.generic', { defaultValue: 'errors.generic' })}</CardTitle>
        </CardHeader>

        <CardContent className="space-y-1 pb-3 text-xs">
          <p className="text-destructive">
            {translatedActionError
              ? t(translatedActionError.messageKey, { defaultValue: actionError })
              : t(actionError, { defaultValue: actionError })}
          </p>

          {translatedActionError ? (
            <p className="text-destructive">
              {translatedActionError.affectedSummoner ? `${translatedActionError.affectedSummoner}: ` : ''}

              {t(translatedActionError.actionKey, { defaultValue: actionError })}
            </p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  )
}
