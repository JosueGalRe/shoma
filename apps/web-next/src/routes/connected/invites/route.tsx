import { createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'

import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Spinner } from '@/components/ui'
import { useInvites } from '@/features/invites'

function InvitesRouteComponent() {
  const { t } = useTranslation()
  const { acceptInvite, declineInvite, error, invites, isLoading } = useInvites()

  return (
    <Card className="border-gray-800 bg-gray-950 text-white">
      <CardHeader>
        <CardTitle>{t('invites.title')}</CardTitle>
        <CardDescription className="text-gray-400">{t('invites.pending')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error ? <p className="text-sm text-red-400">{error.message}</p> : null}
        {isLoading ? (
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Spinner className="h-4 w-4" />
            {t('invites.loading')}
          </div>
        ) : null}

        {invites.length === 0 && !isLoading ? <p className="text-sm text-gray-400">{t('invites.noInvites')}</p> : null}

        {invites.length > 0 ? (
          <ul className="space-y-3">
            {invites.map((invite) => (
              <li key={invite.id} className="rounded-md border border-gray-800 bg-gray-900 p-3">
                <div className="space-y-1">
                  <p className="font-medium text-white">{invite.inviterName}</p>
                  <p className="text-sm text-gray-400">{invite.gameMode}</p>
                </div>
                <div className="mt-3 flex gap-2">
                  <Button className="flex-1" onClick={() => void acceptInvite(invite.id)}>
                    {t('invites.accept')}
                  </Button>
                  <Button className="flex-1" variant="secondary" onClick={() => void declineInvite(invite.id)}>
                    {t('invites.decline')}
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        ) : null}
      </CardContent>
    </Card>
  )
}

export const Route = createFileRoute('/connected/invites')({
  component: InvitesRouteComponent,
})
