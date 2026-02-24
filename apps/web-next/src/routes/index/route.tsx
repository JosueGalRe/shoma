import { createFileRoute } from '@tanstack/react-router'

import { ConnectScreen } from '@features/connect/components/connect-screen'
import { useConnectPageController } from '@features/connect/hooks/use-connect-page-controller'
import { toConnectScreenProps } from './-index-utils'

export const Route = createFileRoute('/')({
  component: IndexRouteComponent,
})

function IndexRouteComponent() {
  const connectScreenProps = toConnectScreenProps(useConnectPageController())

  return <ConnectScreen {...connectScreenProps} />
}
