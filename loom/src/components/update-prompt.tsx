import { useTranslation } from 'react-i18next'

import { Button, Card, CardContent } from '@/components/ui'

interface UpdatePromptProps {
  onDismiss: () => void
  onUpdate: () => void
}

export function UpdatePrompt({ onDismiss, onUpdate }: UpdatePromptProps) {
  const { t } = useTranslation()

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <Card className="w-full max-w-sm">
        <CardContent className="flex flex-col gap-4 p-6">
          <h2 className="text-foreground text-lg font-semibold">{t('update.title')}</h2>

          <p className="text-foreground/80 text-sm">{t('update.body')}</p>

          <div className="flex flex-col gap-2">
            <Button onClick={onUpdate} type="button" variant="primary">
              {t('update.updateNow')}
            </Button>

            <Button onClick={onDismiss} type="button" variant="ghost">
              {t('update.later')}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
