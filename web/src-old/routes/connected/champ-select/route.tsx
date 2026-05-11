import { createFileRoute } from '@tanstack/react-router'

import { ChampSelectScreen } from '@features/champ-select/components/champ-select-screen'

export const Route = createFileRoute('/connected/champ-select')({
  component: ConnectedChampSelectRoute,
})

function ConnectedChampSelectRoute() {
  return <ChampSelectScreen />
}
